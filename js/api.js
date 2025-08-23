// API.JS - COMPUZETTA RADIO
// Sistema de API para manejo de música y streaming

class CompuzettaRadioAPI {
    constructor() {
        this.config = {
            musicPath: './music/',
            audioFormats: ['.mp3', '.wav', '.ogg'],
            maxFileSize: 20 * 1024 * 1024, // 20MB
            crossfadeDuration: 3000 // 3 segundos
        };

        // Estructura de carpetas musicales
        this.musicFolders = {
            himno_nacional: { priority: 4, schedule: ['12:00'] },
            variada: { priority: 1, schedule: 'always' },
            jubilo: { priority: 2, schedule: [] },
            adoracion: { priority: 2, schedule: ['06:00', '15:00'] },
            rancheras: { priority: 1, schedule: [] },
            huaynos: { priority: 1, schedule: [] },
            actuales: { priority: 2, schedule: [] },
            pistas: { priority: 1, schedule: [] },
            reflexiones: { priority: 3, schedule: ['09:00', '21:00'] },
            testimoniales: { priority: 3, schedule: ['18:00'] },
            locucion_horas: { priority: 4, schedule: ['*:00'] }, // Cada hora
            publicidad: { priority: 2, schedule: [] },
            jingles: { priority: 3, schedule: [] }
        };

        // Estado del streaming
        this.streamState = {
            currentAudio: null,
            nextAudio: null,
            isPlaying: false,
            currentFolder: 'variada',
            playlist: [],
            currentIndex: 0,
            volume: 0.5,
            crossfading: false,
            djLive: false,
            djAudio: null
        };

        // Cache de archivos de música
        this.musicCache = {};
        this.audioContext = null;
        this.gainNode = null;
        
        this.init();
    }

    async init() {
        console.log('🎵 Inicializando Compuzetta Radio API...');
        
        try {
            await this.initAudioContext();
            await this.loadMusicLibrary();
            this.setupScheduler();
            
            console.log('✅ API inicializada correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando API:', error);
            return false;
        }
    }

    async initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.streamState.volume;
            
            console.log('🔊 Audio Context inicializado');
        } catch (error) {
            console.error('❌ Error inicializando Audio Context:', error);
            throw error;
        }
    }

    async loadMusicLibrary() {
        console.log('📁 Cargando biblioteca musical...');
        
        // En un entorno real, esto haría fetch a un endpoint que liste los archivos
        // Por ahora, simularemos la estructura basada en GitHub Pages
        
        for (const [folderName, config] of Object.entries(this.musicFolders)) {
            try {
                const files = await this.scanMusicFolder(folderName);
                this.musicCache[folderName] = files;
                console.log(`📂 ${folderName}: ${files.length} archivos`);
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar la carpeta ${folderName}:`, error);
                this.musicCache[folderName] = [];
            }
        }
        
        // Crear playlist inicial
        this.generatePlaylist();
    }

    async scanMusicFolder(folderName) {
        // En GitHub Pages, necesitamos una lista predefinida o un índice
        // Aquí simularemos archivos comunes que podrían existir
        
        const commonFiles = {
            himno_nacional: ['himno_peru.mp3'],
            variada: [
                'sublime_gracia.mp3',
                'cuan_grande_es_el.mp3', 
                'jesus_es_el_senor.mp3',
                'dios_esta_aqui.mp3',
                'te_alabare.mp3'
            ],
            adoracion: [
                'santo_santo_santo.mp3',
                'alma_bendice.mp3',
                'como_no_creer.mp3',
                'tu_fidelidad.mp3'
            ],
            reflexiones: [
                'reflexion_matutina.mp3',
                'meditacion_nocturna.mp3',
                'palabra_del_dia.mp3'
            ],
            testimoniales: [
                'testimonio_1.mp3',
                'testimonio_2.mp3',
                'testimonio_3.mp3'
            ],
            locucion_horas: [
                'hora_en_punto.mp3',
                'presentacion.mp3'
            ],
            jingles: [
                'compuzetta_jingle.mp3',
                'radio_cristiana.mp3'
            ]
        };

        const files = commonFiles[folderName] || [];
        
        // Verificar si los archivos existen realmente
        const existingFiles = [];
        for (const file of files) {
            try {
                const filePath = `${this.config.musicPath}${folderName}/${file}`;
                // Intentar hacer un HEAD request para verificar existencia
                const response = await fetch(filePath, { method: 'HEAD' });
                if (response.ok) {
                    existingFiles.push({
                        name: file,
                        path: filePath,
                        folder: folderName,
                        size: response.headers.get('content-length') || 0
                    });
                }
            } catch (error) {
                // Archivo no existe o no es accesible
                console.warn(`⚠️ Archivo no encontrado: ${folderName}/${file}`);
            }
        }
        
        return existingFiles;
    }

    generatePlaylist() {
        console.log('📝 Generando playlist...');
        
        // Crear playlist basada en horario y prioridades
        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0') + ':00';
        
        let playlist = [];
        
        // 1. Verificar programación horaria especial
        for (const [folderName, config] of Object.entries(this.musicFolders)) {
            if (config.schedule.includes(currentHour) || 
                config.schedule.includes('*:00') && now.getMinutes() === 0) {
                
                const folderFiles = this.musicCache[folderName] || [];
                if (folderFiles.length > 0) {
                    playlist.push(...folderFiles);
                }
            }
        }
        
        // 2. Si no hay programación especial, usar música variada
        if (playlist.length === 0) {
            const variadaFiles = this.musicCache.variada || [];
            const adoracionFiles = this.musicCache.adoracion || [];
            
            playlist = [...variadaFiles, ...adoracionFiles];
        }
        
        // 3. Mezclar playlist
        playlist = this.shuffleArray(playlist);
        
        // 4. Intercalar jingles y locuciones ocasionalmente
        playlist = this.addIntermissions(playlist);
        
        this.streamState.playlist = playlist;
        this.streamState.currentIndex = 0;
        
        console.log(`✅ Playlist generada: ${playlist.length} elementos`);
    }

    addIntermissions(playlist) {
        const jingles = this.musicCache.jingles || [];
        const locucion = this.musicCache.locucion_horas || [];
        const intermissions = [...jingles, ...locucion];
        
        if (intermissions.length === 0) return playlist;
        
        const newPlaylist = [];
        playlist.forEach((track, index) => {
            newPlaylist.push(track);
            
            // Agregar intermedio cada 3-4 canciones
            if ((index + 1) % 4 === 0 && Math.random() > 0.5) {
                const randomIntermission = intermissions[Math.floor(Math.random() * intermissions.length)];
                newPlaylist.push(randomIntermission);
            }
        });
        
        return newPlaylist;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async startStreaming() {
        if (this.streamState.djLive) {
            console.log('🎙️ DJ en vivo activo, no se puede iniciar streaming automático');
            return false;
        }

        try {
            await this.audioContext.resume();
            
            if (this.streamState.playlist.length === 0) {
                this.generatePlaylist();
            }
            
            await this.playNext();
            this.streamState.isPlaying = true;
            
            console.log('▶️ Streaming iniciado');
            return true;
            
        } catch (error) {
            console.error('❌ Error iniciando streaming:', error);
            return false;
        }
    }

    async playNext() {
        if (this.streamState.playlist.length === 0) {
            console.warn('⚠️ Playlist vacía, regenerando...');
            this.generatePlaylist();
            return;
        }
        
        // Obtener siguiente canción
        const nextTrack = this.streamState.playlist[this.streamState.currentIndex];
        
        if (!nextTrack) {
            // Reiniciar playlist
            this.streamState.currentIndex = 0;
            this.generatePlaylist();
            return;
        }
        
        try {
            // Cargar audio
            const audio = await this.loadAudio(nextTrack.path);
            
            // Aplicar crossfade si hay audio actual
            if (this.streamState.currentAudio) {
                await this.crossfade(this.streamState.currentAudio, audio);
            } else {
                // Primera canción, reproducir directamente
                await this.playAudio(audio);
            }
            
            this.streamState.currentAudio = audio;
            this.streamState.currentIndex = (this.streamState.currentIndex + 1) % this.streamState.playlist.length;
            
            // Notificar cambio de canción
            this.onTrackChange(nextTrack);
            
            // Programar siguiente canción
            const duration = audio.duration * 1000; // Convertir a ms
            setTimeout(() => this.playNext(), duration - this.config.crossfadeDuration);
            
        } catch (error) {
            console.error('❌ Error reproduciendo:', nextTrack.path, error);
            // Saltar a la siguiente
            this.streamState.currentIndex = (this.streamState.currentIndex + 1) % this.streamState.playlist.length;
            setTimeout(() => this.playNext(), 1000);
        }
    }

    async loadAudio(path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(path);
            
            audio.addEventListener('canplaythrough', () => resolve(audio));
            audio.addEventListener('error', (e) => reject(e));
            
            audio.load();
        });
    }

    async playAudio(audio) {
        return new Promise((resolve, reject) => {
            audio.addEventListener('ended', resolve);
            audio.addEventListener('error', reject);
            
            audio.volume = this.streamState.volume;
            audio.play().catch(reject);
        });
    }

    async crossfade(currentAudio, nextAudio) {
        return new Promise((resolve) => {
            const duration = this.config.crossfadeDuration;
            const steps = 50;
            const stepTime = duration / steps;
            let step = 0;
            
            // Iniciar siguiente audio en volumen 0
            nextAudio.volume = 0;
            nextAudio.play();
            
            const fadeInterval = setInterval(() => {
                step++;
                const progress = step / steps;
                
                // Fade out actual, fade in siguiente
                currentAudio.volume = this.streamState.volume * (1 - progress);
                nextAudio.volume = this.streamState.volume * progress;
                
                if (step >= steps) {
                    clearInterval(fadeInterval);
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    resolve();
                }
            }, stepTime);
        });
    }

    onTrackChange(track) {
        // Extraer información del track
        const trackInfo = this.parseTrackInfo(track);
        
        // Disparar evento personalizado
        const event = new CustomEvent('trackchange', {
            detail: {
                title: trackInfo.title,
                artist: trackInfo.artist,
                album: trackInfo.album,
                folder: track.folder,
                path: track.path
            }
        });
        
        document.dispatchEvent(event);
        
        console.log(`🎵 Reproduciendo: ${trackInfo.title} - ${trackInfo.artist}`);
    }

    parseTrackInfo(track) {
        // Extraer información del nombre del archivo
        const filename = track.name.replace(/\.[^/.]+$/, ""); // Remover extensión
        const parts = filename.split('_');
        
        let title = filename;
        let artist = 'Compuzetta Radio';
        let album = track.folder;
        
        // Intentar parsear formato "artista_titulo"
        if (parts.length >= 2) {
            artist = parts[0].replace(/[\-_]/g, ' ');
            title = parts.slice(1).join(' ').replace(/[\-_]/g, ' ');
        }
        
        // Capitalizar palabras
        title = this.capitalizeWords(title);
        artist = this.capitalizeWords(artist);
        album = this.capitalizeWords(album.replace('_', ' '));
        
        return { title, artist, album };
    }

    capitalizeWords(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    // Control de volumen
    setVolume(volume) {
        this.streamState.volume = Math.max(0, Math.min(1, volume));
        
        if (this.gainNode) {
            this.gainNode.gain.value = this.streamState.volume;
        }
        
        if (this.streamState.currentAudio) {
            this.streamState.currentAudio.volume = this.streamState.volume;
        }
    }

    // Control DJ
    setDJLive(isLive, djAudio = null) {
        this.streamState.djLive = isLive;
        
        if (isLive) {
            // Pausar streaming automático
            if (this.streamState.currentAudio) {
                this.streamState.currentAudio.pause();
            }
            
            // Activar audio del DJ
            if (djAudio) {
                this.streamState.djAudio = djAudio;
                djAudio.play();
            }
            
            console.log('🎙️ DJ en vivo ACTIVADO');
        } else {
            // Desactivar DJ, reanudar streaming
            if (this.streamState.djAudio) {
                this.streamState.djAudio.pause();
                this.streamState.djAudio = null;
            }
            
            // Reanudar streaming automático
            if (this.streamState.currentAudio) {
                this.streamState.currentAudio.play();
            }
            
            console.log('🎙️ DJ en vivo DESACTIVADO');
        }
    }

    // Programador automático
    setupScheduler() {
        // Verificar cada minuto si hay programación especial
        setInterval(() => {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                              now.getMinutes().toString().padStart(2, '0');
            
            // Himno Nacional a las 12:00 PM
            if (currentTime === '12:00') {
                this.playSpecialProgram('himno_nacional');
            }
            
            // Regenerar playlist cada hora
            if (now.getMinutes() === 0) {
                console.log('🔄 Regenerando playlist por hora nueva');
                this.generatePlaylist();
            }
            
        }, 60000); // Cada minuto
    }

    async playSpecialProgram(folderName) {
        console.log(`🏆 Programa especial: ${folderName}`);
        
        const specialFiles = this.musicCache[folderName] || [];
        if (specialFiles.length === 0) {
            console.warn(`⚠️ No hay archivos para programa especial: ${folderName}`);
            return;
        }
        
        // Pausar reproducción actual
        if (this.streamState.currentAudio) {
            this.streamState.currentAudio.pause();
        }
        
        // Reproducir programa especial
        const specialTrack = specialFiles[0]; // Tomar el primero
        try {
            const audio = await this.loadAudio(specialTrack.path);
            await this.playAudio(audio);
            this.onTrackChange(specialTrack);
            
            // Después del programa especial, continuar con playlist normal
            audio.addEventListener('ended', () => {
                setTimeout(() => this.playNext(), 2000);
            });
            
        } catch (error) {
            console.error(`❌ Error reproduciendo programa especial:`, error);
            // Continuar con playlist normal
            setTimeout(() => this.playNext(), 1000);
        }
    }

    // API pública para controles externos
    getCurrentTrack() {
        const currentTrack = this.streamState.playlist[this.streamState.currentIndex - 1];
        return currentTrack ? this.parseTrackInfo(currentTrack) : null;
    }

    getPlaylist() {
        return this.streamState.playlist.map(track => this.parseTrackInfo(track));
    }

    getStreamState() {
        return {
            isPlaying: this.streamState.isPlaying,
            volume: this.streamState.volume,
            djLive: this.streamState.djLive,
            currentFolder: this.streamState.currentFolder,
            playlistLength: this.streamState.playlist.length,
            currentIndex: this.streamState.currentIndex
        };
    }
}

// Instancia global
let radioAPI;

// Inicializar cuando esté listo
document.addEventListener('DOMContentLoaded', async () => {
    radioAPI = new CompuzettaRadioAPI();
    
    // Hacer disponible globalmente
    window.radioAPI = radioAPI;
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompuzettaRadioAPI;
}
