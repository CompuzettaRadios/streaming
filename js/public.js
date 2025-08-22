// PUBLIC.JS - COMPUZETTA RADIO
// JavaScript para la página pública de oyentes

class CompuzettaRadioPublic {
    constructor() {
        // Estado global de la radio
        this.radioState = {
            isPlaying: false,
            currentSong: {
                title: "Iniciando transmisión...",
                artist: "Compuzetta Radio"
            },
            volume: 50,
            listeners: 1,
            schedule: [],
            lastUpdate: Date.now()
        };

        // Elementos del DOM
        this.elements = {
            playBtn: document.getElementById('play-btn'),
            audioElement: document.getElementById('radio-stream'),
            volumeSlider: document.getElementById('volume-slider'),
            volumeValue: document.getElementById('volume-value'),
            songTitle: document.getElementById('song-title'),
            songArtist: document.getElementById('song-artist'),
            listenersCount: document.getElementById('listeners-count'),
            chatMessages: document.getElementById('chat-messages'),
            statusText: document.getElementById('status-text'),
            currentTime: document.getElementById('current-time'),
            uptime: document.getElementById('uptime')
        };

        // Configuración
        this.config = {
            streamUrl: '', // URL del stream en producción
            updateInterval: 5000, // Actualizar cada 5 segundos
            chatSimulationInterval: 15000, // Nuevo mensaje cada 15 segundos
            maxChatMessages: 5
        };

        // Datos de simulación
        this.simulationData = {
            songs: [
                { title: "Sublime Gracia", artist: "Coro Cristiano" },
                { title: "Cuán Grande Es Él", artist: "Himnario Tradicional" },
                { title: "Jesús Es El Señor", artist: "Música Cristiana" },
                { title: "Dios Está Aquí", artist: "Adoración y Alabanza" },
                { title: "Te Alabaré", artist: "Canto Congregacional" },
                { title: "Santo, Santo, Santo", artist: "Himnario" },
                { title: "Alma Bendice Al Señor", artist: "Coro de Fe" },
                { title: "Cómo No Creer En Dios", artist: "Música Cristiana Peruana" }
            ],
            chatMessages: [
                { user: "Ana", message: "Bendiciones familia! 🙏" },
                { user: "Carlos", message: "Hermosa música, gracias por este ministerio" },
                { user: "María", message: "Saludos desde Arequipa ❤️" },
                { user: "Pedro", message: "Dios los bendiga grandemente" },
                { user: "Rosa", message: "Que tengan un día lleno de bendiciones" },
                { user: "Luis", message: "Gloria a Dios por esta radio 🙌" },
                { user: "Carmen", message: "Escuchando desde Trujillo 🎵" },
                { user: "Miguel", message: "Esta música alegra mi corazón" },
                { user: "Elena", message: "Gracias por llevar la palabra de Dios" },
                { user: "Roberto", message: "Bendiciones desde Cusco 🏔️" }
            ]
        };

        this.currentSongIndex = 0;
        this.currentChatIndex = 0;
        
        this.init();
    }

    init() {
        console.log('🎵 Inicializando Compuzetta Radio...');
        
        this.setupEventListeners();
        this.setupAudioPlayer();
        this.updateNowPlaying();
        this.updateSchedule();
        this.startChatSimulation();
        this.startStatsUpdate();
        this.startTimeUpdate();
        
        // Aplicar animaciones de entrada
        this.applyEntryAnimations();
        
        console.log('✅ Compuzetta Radio inicializada correctamente');
    }

    setupEventListeners() {
        // Controles del reproductor
        this.elements.playBtn.addEventListener('click', () => this.togglePlayback());
        this.elements.volumeSlider.addEventListener('input', () => this.updateVolume());
        
        // Eventos del audio
        this.elements.audioElement.addEventListener('loadstart', () => {
            console.log('🔄 Cargando stream...');
            this.updateStatus('Conectando...');
        });
        
        this.elements.audioElement.addEventListener('canplay', () => {
            console.log('✅ Stream listo para reproducir');
            this.updateStatus('EN VIVO');
        });
        
        this.elements.audioElement.addEventListener('error', (e) => {
            console.error('❌ Error en stream:', e);
            this.handleStreamError();
        });

        this.elements.audioElement.addEventListener('waiting', () => {
            this.updateStatus('Bufferando...');
        });

        this.elements.audioElement.addEventListener('playing', () => {
            this.updateStatus('EN VIVO');
        });
    }

    setupAudioPlayer() {
        // Configurar volumen inicial
        this.elements.audioElement.volume = this.radioState.volume / 100;
        
        // En producción, aquí se establecería la URL del stream
        // this.elements.audioElement.src = this.config.streamUrl;
    }

    togglePlayback() {
        if (this.radioState.isPlaying) {
            this.stopRadio();
        } else {
            this.startRadio();
        }
    }

    async startRadio() {
        try {
            // En producción, cargar el stream real
            // this.elements.audioElement.src = this.config.streamUrl;
            // await this.elements.audioElement.play();
            
            // Para demo, simular reproducción
            this.simulateRadioStart();
            
            this.radioState.isPlaying = true;
            this.updatePlayButton(true);
            this.updateStatus('EN VIVO');
            
            console.log('▶️ Radio iniciada');
        } catch (error) {
            console.error('❌ Error al iniciar radio:', error);
            this.handleStreamError();
        }
    }

    stopRadio() {
        this.elements.audioElement.pause();
        this.elements.audioElement.src = '';
        this.radioState.isPlaying = false;
        this.updatePlayButton(false);
        this.updateStatus('DETENIDO');
        
        console.log('⏹️ Radio detenida');
    }

    simulateRadioStart() {
        // Simular diferentes canciones para la demo
        const updateSong = () => {
            if (this.radioState.isPlaying) {
                const song = this.simulationData.songs[this.currentSongIndex];
                this.radioState.currentSong = song;
                this.updateNowPlaying();
                this.currentSongIndex = (this.currentSongIndex + 1) % this.simulationData.songs.length;
            }
        };
        
        // Primera canción inmediatamente
        updateSong();
        
        // Cambiar canción cada 45 segundos para la demo
        setInterval(updateSong, 45000);
    }

    updatePlayButton(playing) {
        const icon = this.elements.playBtn.querySelector('i');
        
        if (playing) {
            icon.className = 'fas fa-pause';
            this.elements.playBtn.style.background = 'linear-gradient(45deg, #DC143C, #FF6347)';
            this.elements.playBtn.title = 'Pausar';
        } else {
            icon.className = 'fas fa-play';
            this.elements.playBtn.style.background = 'linear-gradient(45deg, #2E8B57, #32CD32)';
            this.elements.playBtn.title = 'Reproducir';
        }
    }

    updateVolume() {
        this.radioState.volume = parseInt(this.elements.volumeSlider.value);
        this.elements.volumeValue.textContent = this.radioState.volume + '%';
        this.elements.audioElement.volume = this.radioState.volume / 100;
        
        // Actualizar ícono de volumen
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const volumeControls = document.querySelector('.volume-control');
        const firstIcon = volumeControls.querySelector('i');
        const lastIcon = volumeControls.querySelector('i:last-of-type');
        
        if (this.radioState.volume === 0) {
            firstIcon.className = 'fas fa-volume-mute';
        } else if (this.radioState.volume < 50) {
            firstIcon.className = 'fas fa-volume-down';
        } else {
            firstIcon.className = 'fas fa-volume-up';
        }
    }

    updateNowPlaying() {
        this.elements.songTitle.textContent = this.radioState.currentSong.title;
        this.elements.songArtist.textContent = this.radioState.currentSong.artist;
        
        // Efecto de actualización
        this.elements.songTitle.style.animation = 'none';
        this.elements.songArtist.style.animation = 'none';
        
        setTimeout(() => {
            this.elements.songTitle.style.animation = 'fadeIn 0.5s ease-in';
            this.elements.songArtist.style.animation = 'fadeIn 0.5s ease-in';
        }, 10);
    }

    updateStatus(status) {
        this.elements.statusText.textContent = status;
        
        // Cambiar color del status dot según el estado
        const statusDot = document.querySelector('.status-dot');
        if (status === 'EN VIVO') {
            statusDot.style.background = '#32CD32';
            statusDot.style.boxShadow = '0 0 10px #32CD32';
        } else if (status === 'Conectando...' || status === 'Bufferando...') {
            statusDot.style.background = '#FFD700';
            statusDot.style.boxShadow = '0 0 10px #FFD700';
        } else {
            statusDot.style.background = '#DC143C';
            statusDot.style.boxShadow = '0 0 10px #DC143C';
        }
    }

    startChatSimulation() {
        const addRandomMessage = () => {
            if (Math.random() > 0.3) { // 70% probabilidad
                const messageData = this.simulationData.chatMessages[this.currentChatIndex];
                this.addChatMessage(messageData.user, messageData.message);
                this.currentChatIndex = (this.currentChatIndex + 1) % this.simulationData.chatMessages.length;
            }
        };
        
        // Mensaje inicial después de 3 segundos
        setTimeout(addRandomMessage, 3000);
        
        // Mensajes periódicos
        setInterval(addRandomMessage, this.config.chatSimulationInterval);
    }

    addChatMessage(user, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `
            <span class="chat-user">
                <i class="fas fa-user"></i> ${user}:
            </span> 
            ${message}
        `;
        
        // Efecto de entrada
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(-20px)';
        
        this.elements.chatMessages.appendChild(messageDiv);
        
        // Animar entrada
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.5s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateX(0)';
        }, 50);
        
        // Scroll al final
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Mantener solo los últimos mensajes
        const messages = this.elements.chatMessages.querySelectorAll('.chat-message');
        if (messages.length > this.config.maxChatMessages) {
            const oldMessage = messages[0];
            oldMessage.style.transition = 'all 0.3s ease';
            oldMessage.style.opacity = '0';
            oldMessage.style.transform = 'translateX(-50px)';
            
            setTimeout(() => {
                if (oldMessage.parentNode) {
                    oldMessage.parentNode.removeChild(oldMessage);
                }
            }, 300);
        }
    }

    startStatsUpdate() {
        setInterval(() => {
            // Simular fluctuación de oyentes
            const baseListeners = this.radioState.isPlaying ? 2 : 1;
            const variation = Math.floor(Math.random() * 4); // 0-3
            this.radioState.listeners = baseListeners + variation;
            this.elements.listenersCount.textContent = this.radioState.listeners;
            
            // Actualizar último update
            this.radioState.lastUpdate = Date.now();
        }, this.config.updateInterval);
    }

    startTimeUpdate() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('es-PE', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            
            if (this.elements.currentTime) {
                this.elements.currentTime.textContent = timeString;
            }
        };
        
        // Actualizar inmediatamente y luego cada segundo
        updateTime();
        setInterval(updateTime, 1000);
    }

    updateSchedule() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Resaltar programa actual
        const scheduleItems = document.querySelectorAll('.schedule-item');
        scheduleItems.forEach(item => {
            const timeText = item.querySelector('.schedule-time').textContent;
            const scheduleHour = parseInt(timeText.split(':')[0]);
            
            if (scheduleHour === currentHour) {
                item.style.background = 'rgba(50, 205, 50, 0.2)';
                item.style.borderLeft = '4px solid #32CD32';
                item.style.paddingLeft = '12px';
                item.style.borderRadius = '0 8px 8px 0';
            } else {
                item.style.background = '';
                item.style.borderLeft = '';
                item.style.paddingLeft = '';
                item.style.borderRadius = '';
            }
        });
    }

    handleStreamError() {
        this.radioState.isPlaying = false;
        this.updatePlayButton(false);
        this.updateStatus('ERROR');
        
        // Mostrar mensaje de error temporal
        this.showNotification('Error de conexión. Reintentando...', 'error');
        
        // Reintentar después de 5 segundos
        setTimeout(() => {
            this.updateStatus('LISTO');
        }, 5000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#DC143C' : '#32CD32'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        
        // Agregar estilos de animación si no existen
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    applyEntryAnimations() {
        // Aplicar animaciones con delay escalonado
        const animatedElements = document.querySelectorAll('.fade-in, .slide-up');
        animatedElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.1}s`;
        });
    }
}

// Inicializar cuando el DOM esté listo
let compuzettaRadio;
document.addEventListener('DOMContentLoaded', () => {
    compuzettaRadio = new CompuzettaRadioPublic();
    
    // Actualizar programación cada minuto
    setInterval(() => compuzettaRadio.updateSchedule(), 60000);
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('🔧 Service Worker registrado:', registration.scope);
            })
            .catch(function(error) {
                console.log('❌ Error registrando Service Worker:', error);
            });
    });
}

// Manejar visibilidad de la página
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && compuzettaRadio) {
        // Actualizar cuando la página vuelve a ser visible
        compuzettaRadio.updateSchedule();
        compuzettaRadio.radioState.lastUpdate = Date.now();
    }
});

// Exportar para uso global si es necesario
window.compuzettaRadio = compuzettaRadio;
