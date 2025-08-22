// DJ Panel JavaScript - Compuzetta Radio
class DJPanel {
    constructor() {
        this.isAuthenticated = false;
        this.isLive = false;
        this.currentTrack = null;
        this.playlist = [];
        this.deckA = { audio: null, track: null, volume: 100, playing: false };
        this.deckB = { audio: null, track: null, volume: 100, playing: false };
        this.crossfadeValue = 50;
        this.airTimeStart = null;
        this.airTimeInterval = null;
        this.listenerCount = 0;
        this.tracksPlayed = 0;
        this.musicFolders = {
            'variada': '🎵 Música Variada',
            'jubilo': '🎉 Júbilo', 
            'adoracion': '🙏 Adoración',
            'rancheras': '🤠 Rancheras',
            'huaynos': '🎺 Huaynos',
            'actuales': '🆕 Actuales',
            'pistas': '🎼 Pistas',
            'reflexiones': '💭 Reflexiones',
            'testimoniales': '🗣️ Testimonios',
            'jingles': '🔊 Jingles'
        };
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.updateStats();
        this.loadChatHistory();
        
        // Actualizar estadísticas cada 5 segundos
        setInterval(() => this.updateStats(), 5000);
    }

    checkAuthentication() {
        const isAuthenticated = sessionStorage.getItem('dj_authenticated');
        if (isAuthenticated === 'true') {
            this.isAuthenticated = true;
            this.showDJPanel();
        } else {
            this.showLoginOverlay();
        }
    }

    showLoginOverlay() {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('djPanel').style.display = 'none';
    }

    showDJPanel() {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('djPanel').style.display = 'block';
        this.updateLiveStatus();
    }

    setupEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Live Controls
        document.getElementById('goLiveBtn').addEventListener('click', () => this.goLive());
        document.getElementById('stopLiveBtn').addEventListener('click', () => this.stopLive());

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Folder Selection
        document.getElementById('folderSelect').addEventListener('change', (e) => {
            this.loadFolderTracks(e.target.value);
        });

        // Crossfade
        document.getElementById('crossfadeSlider').addEventListener('input', (e) => {
            this.updateCrossfade(e.target.value);
        });

        // Playlist Controls
        document.getElementById('clearPlaylistBtn').addEventListener('click', () => this.clearPlaylist());
        document.getElementById('shufflePlaylistBtn').addEventListener('click', () => this.shufflePlaylist());

        // Chat
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());

        // System Controls
        document.getElementById('restartStreamBtn').addEventListener('click', () => this.restartStream());
        document.getElementById('emergencyStopBtn').addEventListener('click', () => this.emergencyStop());

        // Deck Controls
        this.setupDeckControls();
    }

    setupDeckControls() {
        // Deck A Controls
        const deckA = document.getElementById('deckA');
        deckA.querySelector('.play-btn').addEventListener('click', () => this.playDeck('A'));
        deckA.querySelector('.pause-btn').addEventListener('click', () => this.pauseDeck('A'));
        deckA.querySelector('.volume-slider').addEventListener('input', (e) => this.setDeckVolume('A', e.target.value));

        // Deck B Controls
        const deckB = document.getElementById('deckB');
        deckB.querySelector('.play-btn').addEventListener('click', () => this.playDeck('B'));
        deckB.querySelector('.pause-btn').addEventListener('click', () => this.pauseDeck('B'));
        deckB.querySelector('.volume-slider').addEventListener('input', (e) => this.setDeckVolume('B', e.target.value));
    }

    async handleLogin() {
        const password = document.getElementById('djPassword').value;
        
        try {
            // Simulación de autenticación (en producción sería una API real)
            if (password === 'dj123') { // Cambiar por tu password
                this.isAuthenticated = true;
                sessionStorage.setItem('dj_authenticated', 'true');
                sessionStorage.setItem('user_role', 'dj');
                this.showDJPanel();
            } else {
                this.showError('Contraseña incorrecta');
            }
        } catch (error) {
            this.showError('Error de conexión');
        }
    }

    logout() {
        if (this.isLive) {
            if (!confirm('¿Estás seguro de salir mientras estás al aire?')) return;
            this.stopLive();
        }
        
        sessionStorage.removeItem('dj_authenticated');
        sessionStorage.removeItem('user_role');
        this.isAuthenticated = false;
        this.showLoginOverlay();
    }

    async goLive() {
        try {
            // Iniciar transmisión en vivo
            this.isLive = true;
            this.airTimeStart = Date.now();
            
            // Actualizar UI
            this.updateLiveStatus();
            document.getElementById('goLiveBtn').style.display = 'none';
            document.getElementById('stopLiveBtn').style.display = 'inline-flex';

            // Iniciar timer de tiempo al aire
            this.startAirTimeCounter();

            // Notificar a los oyentes
            this.sendSystemMessage('📻 DJ en vivo - ¡Comenzamos la transmisión!');
            
            // Simular conexión con servidor de streaming
            await this.connectToStreamServer();
            
            this.showSuccess('¡Transmisión iniciada exitosamente!');
        } catch (error) {
            this.showError('Error al iniciar transmisión: ' + error.message);
            this.isLive = false;
            this.updateLiveStatus();
        }
    }

    async stopLive() {
        if (!confirm('¿Confirmas salir del aire?')) return;

        try {
            this.isLive = false;
            
            // Parar audio de decks
            this.pauseDeck('A');
            this.pauseDeck('B');
            
            // Actualizar UI
            this.updateLiveStatus();
            document.getElementById('stopLiveBtn').style.display = 'none';
            document.getElementById('goLiveBtn').style.display = 'inline-flex';

            // Parar timer
            if (this.airTimeInterval) {
                clearInterval(this.airTimeInterval);
                this.airTimeInterval = null;
            }

            // Notificar
            this.sendSystemMessage('📻 Transmisión finalizada - Volvemos a la programación automática');
            
            // Desconectar servidor
            await this.disconnectFromStreamServer();
            
            this.showSuccess('Transmisión finalizada');
        } catch (error) {
            this.showError('Error al finalizar transmisión: ' + error.message);
        }
    }

    updateLiveStatus() {
        const liveStatus = document.getElementById('liveStatus');
        const statusIcon = liveStatus.querySelector('i');
        const statusText = liveStatus.querySelector('span');

        if (this.isLive) {
            liveStatus.classList.add('live');
            statusText.textContent = 'EN VIVO';
            statusIcon.className = 'fas fa-circle';
        } else {
            liveStatus.classList.remove('live');
            statusText.textContent = 'FUERA DEL AIRE';
            statusIcon.className = 'fas fa-circle';
        }
    }

    startAirTimeCounter() {
        this.airTimeInterval = setInterval(() => {
            if (this.airTimeStart) {
                const elapsed = Date.now() - this.airTimeStart;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                document.getElementById('airTime').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    async loadFolderTracks(folder) {
        if (!folder) {
            document.getElementById('trackList').innerHTML = `
                <div class="no-folder-selected">
                    <i class="fas fa-folder-open"></i>
                    <p>Selecciona una carpeta para ver las pistas disponibles</p>
                </div>
            `;
            return;
        }

        try {
            // Simular carga de archivos de la carpeta
            const tracks = await this.getMusicFromFolder(folder);
            this.displayTracks(tracks, folder);
        } catch (error) {
            this.showError('Error al cargar carpeta: ' + error.message);
        }
    }

    async getMusicFromFolder(folder) {
        // Simulación de datos - en producción esto vendría de una API
        const sampleTracks = {
            'variada': [
                { name: 'Canción 1.mp3', duration: '3:45' },
                { name: 'Canción 2.mp3', duration: '4:12' },
                { name: 'Canción 3.mp3', duration: '3:28' }
            ],
            'jubilo': [
                { name: 'Júbilo 1.mp3', duration: '4:03' },
                { name: 'Júbilo 2.mp3', duration: '3:51' }
            ],
            'adoracion': [
                { name: 'Adoración 1.mp3', duration: '5:22' },
                { name: 'Adoración 2.mp3', duration: '4:45' }
            ]
        };

        return sampleTracks[folder] || [];
    }

    displayTracks(tracks, folder) {
        const trackList = document.getElementById('trackList');
        
        if (tracks.length === 0) {
            trackList.innerHTML = `
                <div class="no-folder-selected">
                    <i class="fas fa-music"></i>
                    <p>No hay pistas en esta carpeta</p>
                </div>
            `;
            return;
        }

        trackList.innerHTML = tracks.map(track => `
            <div class="track-item" draggable="true" data-folder="${folder}" data-track="${track.name}">
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-duration">${track.duration}</div>
                </div>
                <div class="track-actions">
                    <button onclick="djPanel.loadToDeck('A', '${folder}', '${track.name}')" title="Cargar a Deck A">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button onclick="djPanel.loadToDeck('B', '${folder}', '${track.name}')" title="Cargar a Deck B">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button onclick="djPanel.addToPlaylist('${folder}', '${track.name}')" title="Añadir a Playlist">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const trackItems = document.querySelectorAll('.track-item');
        const playlist = document.getElementById('tempPlaylist');

        trackItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    folder: item.dataset.folder,
                    track: item.dataset.track
                }));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        playlist.addEventListener('dragover', (e) => {
            e.preventDefault();
            playlist.classList.add('drag-over');
        });

        playlist.addEventListener('dragleave', () => {
            playlist.classList.remove('drag-over');
        });

        playlist.addEventListener('drop', (e) => {
            e.preventDefault();
            playlist.classList.remove('drag-over');
            
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.addToPlaylist(data.folder, data.track);
        });
    }

    async loadToDeck(deck, folder, track) {
        try {
            const deckObj = deck === 'A' ? this.deckA : this.deckB;
            const deckElement = document.getElementById(`deck${deck}`);
            
            // Simular carga de audio
            const audioUrl = `music/${folder}/${track}`;
            
            // Parar audio anterior si existe
            if (deckObj.audio) {
                deckObj.audio.pause();
                deckObj.audio = null;
            }
            
            // Crear nuevo audio
            deckObj.audio = new Audio(audioUrl);
            deckObj.track = { folder, name: track };
            deckObj.playing = false;
            
            // Actualizar UI
            deckElement.querySelector('.track-name').textContent = track;
            deckElement.querySelector('.time-display').textContent = '00:00 / 00:00';
            
            // Event listeners para el audio
            deckObj.audio.addEventListener('loadedmetadata', () => {
                const duration = this.formatTime(deckObj.audio.duration);
                deckElement.querySelector('.time-display').textContent = `00:00 / ${duration}`;
            });
            
            deckObj.audio.addEventListener('timeupdate', () => {
                if (deckObj.audio) {
                    const current = this.formatTime(deckObj.audio.currentTime);
                    const duration = this.formatTime(deckObj.audio.duration || 0);
                    deckElement.querySelector('.time-display').textContent = `${current} / ${duration}`;
                }
            });
            
            this.showSuccess(`Pista cargada en Deck ${deck}: ${track}`);
        } catch (error) {
            this.showError(`Error cargando pista en Deck ${deck}: ${error.message}`);
        }
    }

    playDeck(deck) {
        const deckObj = deck === 'A' ? this.deckA : this.deckB;
        
        if (!deckObj.audio) {
            this.showError(`No hay pista cargada en Deck ${deck}`);
            return;
        }

        try {
            deckObj.audio.play();
            deckObj.playing = true;
            this.updateDeckButtons(deck);
            
            if (this.isLive) {
                this.tracksPlayed++;
                document.getElementById('tracksPlayed').textContent = this.tracksPlayed;
            }
        } catch (error) {
            this.showError(`Error reproduciendo Deck ${deck}: ${error.message}`);
        }
    }

    pauseDeck(deck) {
        const deckObj = deck === 'A' ? this.deckA : this.deckB;
        
        if (deckObj.audio) {
            deckObj.audio.pause();
            deckObj.playing = false;
            this.updateDeckButtons(deck);
        }
    }

    setDeckVolume(deck, volume) {
        const deckObj = deck === 'A' ? this.deckA : this.deckB;
        
        deckObj.volume = volume;
        if (deckObj.audio) {
            // Aplicar crossfade
            const finalVolume = this.calculateCrossfadeVolume(deck, volume);
            deckObj.audio.volume = finalVolume / 100;
        }
    }

    updateCrossfade(value) {
        this.crossfadeValue = value;
        
        // Actualizar volúmenes según crossfade
        if (this.deckA.audio) {
            const volumeA = this.calculateCrossfadeVolume('A', this.deckA.volume);
            this.deckA.audio.volume = volumeA / 100;
        }
        
        if (this.deckB.audio) {
            const volumeB = this.calculateCrossfadeVolume('B', this.deckB.volume);
            this.deckB.audio.volume = volumeB / 100;
        }
    }

    calculateCrossfadeVolume(deck, baseVolume) {
        const crossfade = this.crossfadeValue;
        
        if (deck === 'A') {
            // Deck A: 100% cuando crossfade=0, 0% cuando crossfade=100
            const multiplier = (100 - crossfade) / 100;
            return baseVolume * multiplier;
        } else {
            // Deck B: 0% cuando crossfade=0, 100% cuando crossfade=100
            const multiplier = crossfade / 100;
            return baseVolume * multiplier;
        }
    }

    updateDeckButtons(deck) {
        const deckElement = document.getElementById(`deck${deck}`);
        const deckObj = deck === 'A' ? this.deckA : this.deckB;
        
        const playBtn = deckElement.querySelector('.play-btn');
        const pauseBtn = deckElement.querySelector('.pause-btn');
        
        if (deckObj.playing) {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
        } else {
            playBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'none';
        }
    }

    addToPlaylist(folder, track) {
        const playlistItem = {
            id: Date.now() + Math.random(),
            folder,
            track,
            name: track
        };
        
        this.playlist.push(playlistItem);
        this.renderPlaylist();
        this.showSuccess(`Añadido a playlist: ${track}`);
    }

    renderPlaylist() {
        const playlistElement = document.getElementById('tempPlaylist');
        
        if (this.playlist.length === 0) {
            playlistElement.innerHTML = `
                <div class="empty-playlist">
                    <i class="fas fa-list"></i>
                    <p>Arrastra pistas aquí para crear tu playlist temporal</p>
                </div>
            `;
            return;
        }

        playlistElement.innerHTML = this.playlist.map(item => `
            <div class="playlist-item" data-id="${item.id}">
                <div class="playlist-item-info">
                    <div class="track-name">${item.name}</div>
                    <div class="track-folder">${this.musicFolders[item.folder] || item.folder}</div>
                </div>
                <div class="playlist-item-actions">
                    <button onclick="djPanel.removeFromPlaylist('${item.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    removeFromPlaylist(itemId) {
        this.playlist = this.playlist.filter(item => item.id != itemId);
        this.renderPlaylist();
    }

    clearPlaylist() {
        if (this.playlist.length === 0) return;
        
        if (confirm('¿Confirmas limpiar toda la playlist?')) {
            this.playlist = [];
            this.renderPlaylist();
            this.showSuccess('Playlist limpiada');
        }
    }

    shufflePlaylist() {
        if (this.playlist.length < 2) return;
        
        for (let i = this.playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
        }
        
        this.renderPlaylist();
        this.showSuccess('Playlist mezclada');
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const chatMessage = {
            id: Date.now(),
            sender: 'DJ',
            message: message,
            timestamp: new Date(),
            type: 'dj'
        };
        
        this.addChatMessage(chatMessage);
        input.value = '';
        
        // Simular envío a oyentes
        this.broadcastChatMessage(chatMessage);
    }

    sendSystemMessage(message) {
        const systemMessage = {
            id: Date.now(),
            message: message,
            timestamp: new Date(),
            type: 'system'
        };
        
        this.addChatMessage(systemMessage);
        this.broadcastChatMessage(systemMessage);
    }

    addChatMessage(messageObj) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        
        if (messageObj.type === 'system') {
            messageDiv.className = 'system-message';
            messageDiv.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>${messageObj.message}</span>
            `;
        } else {
            messageDiv.className = `chat-message ${messageObj.type}`;
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${messageObj.sender}</span>
                    <span class="message-time">${this.formatTime(messageObj.timestamp)}</span>
                </div>
                <div class="message-content">${messageObj.message}</div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    loadChatHistory() {
        // Mensaje de bienvenida
        this.addChatMessage({
            id: 1,
            message: 'Panel DJ iniciado. Los mensajes de oyentes aparecerán aquí.',
            timestamp: new Date(),
            type: 'system'
        });
    }

    broadcastChatMessage(message) {
        // Simular envío a todos los oyentes conectados
        console.log('Broadcasting message:', message);
    }

    async restartStream() {
        if (!confirm('¿Confirmas reiniciar el stream? Esto puede afectar a los oyentes.')) return;
        
        try {
            this.showSuccess('Reiniciando stream...');
            
            // Simular reinicio
            if (this.isLive) {
                await this.disconnectFromStreamServer();
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.connectToStreamServer();
            }
            
            this.showSuccess('Stream reiniciado exitosamente');
        } catch (error) {
            this.showError('Error al reiniciar stream: ' + error.message);
        }
    }

    async emergencyStop() {
        if (!confirm('⚠️ PARADA DE EMERGENCIA ⚠️\n\nEsto detendrá toda la transmisión inmediatamente. ¿Continuar?')) return;
        
        try {
            // Parar todo inmediatamente
            this.pauseDeck('A');
            this.pauseDeck('B');
            
            if (this.isLive) {
                this.isLive = false;
                this.updateLiveStatus();
                await this.disconnectFromStreamServer();
            }
            
            // Parar timers
            if (this.airTimeInterval) {
                clearInterval(this.airTimeInterval);
                this.airTimeInterval = null;
            }
            
            this.sendSystemMessage('🚨 PARADA DE EMERGENCIA ACTIVADA - Transmisión detenida');
            this.showError('Parada de emergencia activada');
            
        } catch (error) {
            this.showError('Error en parada de emergencia: ' + error.message);
        }
    }

    async connectToStreamServer() {
        // Simular conexión con servidor de streaming
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Conectado al servidor de streaming');
                resolve();
            }, 1000);
        });
    }

    async disconnectFromStreamServer() {
        // Simular desconexión del servidor
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Desconectado del servidor de streaming');
                resolve();
            }, 500);
        });
    }

    updateStats() {
        // Simular estadísticas en tiempo real
        this.listenerCount = Math.floor(Math.random() * 10) + (this.isLive ? 5 : 0);
        document.getElementById('listenerCount').textContent = this.listenerCount;
    }

    formatTime(timeValue) {
        if (typeof timeValue === 'object') {
            // Es un Date object
            return timeValue.toLocaleTimeString();
        } else {
            // Es duración en segundos
            const minutes = Math.floor(timeValue / 60);
            const seconds = Math.floor(timeValue % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--accent-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow-light);
            z-index:
X SE CORTÓ XX
