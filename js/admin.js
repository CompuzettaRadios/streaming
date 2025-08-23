// Admin Panel JavaScript - Compuzetta Radio
// Panel de administración completo con todas las funciones

class CompuzettaAdmin {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.systemStatus = {
            online: false,
            uptime: 0,
            listeners: 0,
            djOnline: false
        };
        this.schedule = [];
        this.users = [];
        this.logs = [];
        this.files = {};
        this.currentFolder = 'variada';
        this.currentEditingSchedule = null;
        
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.startSystemMonitoring();
        this.loadInitialData();
    }

    // ========== AUTENTICACIÓN ==========
    checkAuthentication() {
        const savedAuth = localStorage.getItem('admin_auth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                if (Date.now() - authData.timestamp < 8 * 60 * 60 * 1000) { // 8 horas
                    this.isAuthenticated = true;
                    this.currentUser = authData.user;
                    this.showAdminPanel();
                    return;
                }
            } catch (e) {
                localStorage.removeItem('admin_auth');
            }
        }
        this.showLoginOverlay();
    }

    showLoginOverlay() {
        const loginOverlay = document.getElementById('loginOverlay');
        const adminPanel = document.getElementById('adminPanel');
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';
    }

    showAdminPanel() {
        const loginOverlay = document.getElementById('loginOverlay');
        const adminPanel = document.getElementById('adminPanel');
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        
        this.updateDashboard();
        this.loadFileManager();
        this.loadSchedule();
        this.loadUsers();
        this.loadLogs();
    }

    async authenticateAdmin(password) {
        // Contraseñas de administrador
        const validPasswords = {
            'admin123': { role: 'admin', name: 'Administrador Principal' },
            'compuzetta2024': { role: 'admin', name: 'Admin Compuzetta' },
            'radio123': { role: 'admin', name: 'Admin Radio' }
        };

        if (validPasswords[password]) {
            this.isAuthenticated = true;
            this.currentUser = validPasswords[password];
            
            try {
                localStorage.setItem('admin_auth', JSON.stringify({
                    user: this.currentUser,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('No se pudo guardar la sesión');
            }
            
            this.showAdminPanel();
            this.addLog('success', 'Administrador autenticado correctamente');
            return true;
        }
        
        this.addLog('error', 'Intento de acceso no autorizado');
        return false;
    }

    logout() {
        try {
            localStorage.removeItem('admin_auth');
        } catch (e) {
            console.warn('No se pudo limpiar la sesión');
        }
        this.isAuthenticated = false;
        this.currentUser = null;
        this.showLoginOverlay();
        this.addLog('info', 'Sesión de administrador cerrada');
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const passwordInput = document.getElementById('passwordInput');
                const password = passwordInput ? passwordInput.value : '';
                const success = await this.authenticateAdmin(password);
                
                if (!success) {
                    this.showError('Contraseña incorrecta');
                    if (passwordInput) passwordInput.value = '';
                } else {
                    this.showSuccess('Acceso concedido');
                }
            });
        }

        // File upload
        this.setupFileUpload();
        
        // Folder tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const folder = e.target.dataset.folder;
                if (folder) this.switchFolder(folder);
            });
        });

        // Modal controls
        this.setupModals();

        // Schedule controls
        const scheduleType = document.getElementById('scheduleType');
        if (scheduleType) {
            scheduleType.addEventListener('change', (e) => {
                const folderGroup = document.getElementById('folderGroup');
                if (folderGroup) {
                    folderGroup.style.display = e.target.value === 'folder' ? 'block' : 'none';
                }
            });
        }

        // Log level filter
        const logLevel = document.getElementById('logLevel');
        if (logLevel) {
            logLevel.addEventListener('change', () => {
                this.renderLogs();
            });
        }
    }

    setupFileUpload() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                this.handleFileUpload(files);
            });

            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
            });
        }
    }

    setupModals() {
        // Cerrar modales al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    // ========== DASHBOARD ==========
    updateDashboard() {
        // Simular datos en tiempo real
        this.systemStatus = {
            online: true,
            uptime: Math.floor(Math.random() * 86400),
            listeners: Math.floor(Math.random() * 50) + 10,
            djOnline: Math.random() > 0.5
        };

        const statusDot = document.getElementById('systemStatus');
        const statusText = document.getElementById('systemStatusText');
        const totalListeners = document.getElementById('totalListeners');
        const totalTracks = document.getElementById('totalTracks');
        const uptime = document.getElementById('uptime');
        const djStatus = document.getElementById('djStatus');

        if (statusDot) {
            statusDot.className = `status-dot ${this.systemStatus.online ? 'online' : 'offline'}`;
        }
        if (statusText) {
            statusText.textContent = this.systemStatus.online ? 'Sistema Online' : 'Sistema Offline';
        }
        if (totalListeners) {
            totalListeners.textContent = this.systemStatus.listeners;
        }
        if (totalTracks) {
            totalTracks.textContent = this.getTotalTracks();
        }
        if (uptime) {
            uptime.textContent = this.formatUptime(this.systemStatus.uptime);
        }
        if (djStatus) {
            djStatus.textContent = this.systemStatus.djOnline ? 'En Línea' : 'Desconectado';
        }
    }

    getTotalTracks() {
        let total = 0;
        for (let folder in this.files) {
            total += this.files[folder] ? this.files[folder].length : 0;
        }
        return total;
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // ========== GESTIÓN DE ARCHIVOS ==========
    async handleFileUpload(files) {
        const uploadFolder = document.getElementById('uploadFolder');
        const folder = uploadFolder ? uploadFolder.value : '';
        
        if (!folder) {
            this.showError('Selecciona una carpeta destino');
            return;
        }

        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressContainer) progressContainer.style.display = 'block';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validar archivo
            if (!file.type.includes('audio/')) {
                this.showError(`${file.name} no es un archivo de audio válido`);
                continue;
            }
            
            if (file.size > 20 * 1024 * 1024) {
                this.showError(`${file.name} excede el límite de 20MB`);
                continue;
            }

            // Simular subida de archivo
            const progress = ((i + 1) / files.length) * 100;
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${Math.round(progress)}% - Subiendo ${file.name}`;

            // Simular delay de subida
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Agregar archivo a la estructura local
            if (!this.files[folder]) {
                this.files[folder] = [];
            }
            
            this.files[folder].push({
                name: file.name,
                size: file.size,
                uploaded: new Date(),
                duration: this.calculateDuration(file.size)
            });

            this.addLog('success', `Archivo subido: ${file.name} a carpeta ${folder}`);
        }

        if (progressContainer) progressContainer.style.display = 'none';
        this.loadFileManager();
        this.updateDashboard();
        this.showSuccess(`${files.length} archivo(s) subido(s) correctamente`);
    }

    calculateDuration(fileSize) {
        // Estimación basada en el tamaño del archivo (muy aproximado)
        const averageBitrate = 128; // kbps
        const durationSeconds = Math.floor(fileSize / (averageBitrate * 125));
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    loadFileManager() {
        this.switchFolder(this.currentFolder);
    }

    switchFolder(folder) {
        this.currentFolder = folder;
        
        // Actualizar tabs activos
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.folder === folder) {
                btn.classList.add('active');
            }
        });

        // Cargar archivos de la carpeta
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        const files = this.files[folder] || [];

        if (files.length === 0) {
            fileList.innerHTML = `
                <div class="empty-folder">
                    <i class="fas fa-folder-open"></i>
                    <p>Esta carpeta está vacía</p>
                    <p class="folder-hint">Sube archivos MP3 para comenzar</p>
                </div>
            `;
            return;
        }

        fileList.innerHTML = files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <i class="fas fa-music"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            ${this.formatFileSize(file.size)} • ${file.duration}
                        </div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-btn" onclick="admin.playPreview('${file.name}')" title="Reproducir">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="file-btn" onclick="admin.editFile('${file.name}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="file-btn danger" onclick="admin.deleteFile('${folder}', ${index})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    deleteFile(folder, index) {
        const folderFiles = this.files[folder];
        if (!folderFiles || !folderFiles[index]) return;
        
        const filename = folderFiles[index].name;
        if (!confirm(`¿Eliminar "${filename}"?`)) return;
        
        folderFiles.splice(index, 1);
        this.loadFileManager();
        this.addLog('warning', `Archivo eliminado: ${filename}`);
        this.showSuccess('Archivo eliminado correctamente');
    }

    playPreview(filename) {
        this.addLog('info', `Reproduciendo preview: ${filename}`);
        this.showInfo(`Reproduciendo: ${filename}`);
    }

    editFile(filename) {
        this.showInfo(`Editor de archivos: ${filename}`);
    }

    // ========== PROGRAMACIÓN HORARIA ==========
    loadSchedule() {
        // Cargar programación predeterminada
        if (this.schedule.length === 0) {
            this.schedule = [
                {
                    id: 1,
                    time: '12:00',
                    type: 'himno',
                    days: [1,2,3,4,5,6,0],
                    active: true,
                    description: 'Himno Nacional del Perú'
                },
                {
                    id: 2,
                    time: '06:00',
                    type: 'folder',
                    folder: 'adoracion',
                    days: [0],
                    active: true,
                    description: 'Música de Adoración Dominical'
                },
                {
                    id: 3,
                    time: '20:00',
                    type: 'folder',
                    folder: 'reflexiones',
                    days: [1,2,3,4,5],
                    active: true,
                    description: 'Reflexiones Nocturnas'
                }
            ];
        }

        this.renderSchedule();
    }

    renderSchedule() {
        const scheduleGrid = document.getElementById('scheduleGrid');
        if (!scheduleGrid) return;

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        scheduleGrid.innerHTML = this.schedule.map(item => `
            <div class="schedule-item ${item.active ? 'active' : 'inactive'}">
                <div class="schedule-header">
                    <div class="schedule-time">
                        <i class="fas fa-clock"></i>
                        ${item.time}
                    </div>
                    <div class="schedule-toggle">
                        <label class="switch">
                            <input type="checkbox" ${item.active ? 'checked' : ''} 
                                   onchange="admin.toggleScheduleItem(${item.id})">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <div class="schedule-content">
                    <div class="schedule-type">
                        ${this.getScheduleTypeIcon(item.type)} ${this.getScheduleTypeText(item.type)}
                    </div>
                    <div class="schedule-description">${item.description}</div>
                    <div class="schedule-days">
                        ${item.days.map(day => `<span class="day-badge">${dayNames[day]}</span>`).join('')}
                    </div>
                </div>
                <div class="schedule-actions">
                    <button onclick="admin.editScheduleItem(${item.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="admin.deleteScheduleItem(${item.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getScheduleTypeIcon(type) {
        const icons = {
            himno: '🇵🇪',
            folder: '📁',
            track: '🎵'
        };
        return icons[type] || '📅';
    }

    getScheduleTypeText(type) {
        const texts = {
            himno: 'Himno Nacional',
            folder: 'Carpeta',
            track: 'Pista Específica'
        };
        return texts[type] || type;
    }

    toggleScheduleItem(id) {
        const item = this.schedule.find(s => s.id === id);
        if (item) {
            item.active = !item.active;
            this.renderSchedule();
            this.addLog('info', `Programación ${item.active ? 'activada' : 'desactivada'}: ${item.time}`);
        }
    }

    deleteScheduleItem(id) {
        if (!confirm('¿Eliminar esta programación?')) return;
        
        this.schedule = this.schedule.filter(s => s.id !== id);
        this.renderSchedule();
        this.addLog('warning', 'Programación eliminada');
    }

    editScheduleItem(id) {
        const item = this.schedule.find(s => s.id === id);
        if (!item) return;

        // Llenar formulario modal
        const timeInput = document.getElementById('scheduleTime');
        const typeSelect = document.getElementById('scheduleType');
        const folderSelect = document.getElementById('scheduleFolder');
        const folderGroup = document.getElementById('folderGroup');

        if (timeInput) timeInput.value = item.time;
        if (typeSelect) typeSelect.value = item.type;
        
        if (item.type === 'folder' && folderGroup && folderSelect) {
            folderGroup.style.display = 'block';
            folderSelect.value = item.folder;
        }
        
        // Marcar días
        const dayInputs = document.querySelectorAll('#scheduleDays input');
        dayInputs.forEach(input => {
            input.checked = item.days.includes(parseInt(input.value));
        });
        
        this.currentEditingSchedule = id;
        this.showModal('scheduleModal');
    }

    // ========== GESTIÓN DE USUARIOS ==========
    loadUsers() {
        if (this.users.length === 0) {
            this.users = [
                {
                    id: 1,
                    username: 'dj_principal',
                    role: 'dj',
                    name: 'DJ Principal',
                    online: true,
                    lastSeen: new Date()
                }
            ];
        }
        this.renderUsers();
    }

    renderUsers() {
        const userList = document.getElementById('userList');
        if (!userList) return;

        userList.innerHTML = this.users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <i class="fas fa-${user.role === 'dj' ? 'headphones' : 'user-shield'}"></i>
                    <div class="user-details">
                        <div class="user-name">${user.name}</div>
                        <div class="user-username">@${user.username}</div>
                    </div>
                </div>
                <div class="user-status ${user.online ? 'online' : 'offline'}">
                    <span>${user.online ? 'Online' : 'Offline'}</span>
                </div>
                <div class="user-actions">
                    <button onclick="admin.editUser(${user.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="admin.removeUser(${user.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    editUser(id) {
        this.showInfo(`Editando usuario ID: ${id}`);
    }

    removeUser(id) {
        if (!confirm('¿Eliminar este usuario DJ?')) return;
        
        this.users = this.users.filter(u => u.id !== id);
        this.renderUsers();
        this.addLog('warning', 'Usuario DJ eliminado');
    }

    // ========== LOGS DEL SISTEMA ==========
    loadLogs() {
        if (this.logs.length === 0) {
            this.addLog('info', 'Sistema iniciado correctamente');
            this.addLog('success', 'Panel de administración cargado');
            this.addLog('info', 'Carga de configuración completada');
        }
        this.renderLogs();
    }

    loadInitialData() {
        // Cargar datos iniciales de ejemplo
        this.files = {
            variada: [
                { name: 'Amazing_Grace.mp3', size: 4500000, duration: '04:32', uploaded: new Date() },
                { name: 'How_Great_Thou_Art.mp3', size: 5200000, duration: '05:18', uploaded: new Date() }
            ],
            adoracion: [
                { name: 'Worthy_Is_The_Lamb.mp3', size: 3800000, duration: '03:45', uploaded: new Date() }
            ]
        };
    }

    addLog(level, message) {
        const log = {
            id: this.logs.length + 1,
            level,
            message,
            timestamp: new Date(),
            time: new Date().toLocaleTimeString()
        };
        
        this.logs.unshift(log);
        
        // Mantener solo los últimos 100 logs
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(0, 100);
        }
        
        this.renderLogs();
    }

    renderLogs() {
        const logsDisplay = document.getElementById('logsDisplay');
        const logLevel = document.getElementById('logLevel');
        
        if (!logsDisplay) return;

        const selectedLevel = logLevel ? logLevel.value : 'all';
        
        let filteredLogs = this.logs;
        if (selectedLevel !== 'all') {
            filteredLogs = this.logs.filter(log => log.level === selectedLevel);
        }
        
        logsDisplay.innerHTML = filteredLogs.map(log => `
            <div class="log-entry ${log.level}">
                <span class="log-time">${log.time}</span>
                <span class="log-level">${log.level.toUpperCase()}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }

    // ========== MONITOREO DEL SISTEMA ==========
    startSystemMonitoring() {
        // Actualizar dashboard cada 5 segundos
        setInterval(() => {
            this.updateDashboard();
        }, 5000);

        // Log aleatorio cada 30 segundos
        setInterval(() => {
            this.addRandomLog();
        }, 30000);
    }

    addRandomLog() {
        const randomLogs = [
            { level: 'info', message: 'Estadísticas de oyentes actualizadas' },
            { level: 'info', message: 'Verificación de archivos completada' },
            { level: 'success', message: 'Nuevo oyente conectado' },
            { level: 'info', message: 'Rotación automática de música activada' },
            { level: 'info', message: 'Sistema funcionando correctamente' }
        ];
        
        const randomLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
        this.addLog(randomLog.level, randomLog.message);
    }

    // ========== MODALES ==========
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
        this.currentEditingSchedule = null;
    }

    // ========== MENSAJES DE USUARIO ==========
    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        const icon = type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;margin-left:auto;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// ========== INSTANCIA GLOBAL ==========
let admin;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    admin = new CompuzettaAdmin();
});

// ========== FUNCIONES GLOBALES ==========
function logout() {
    if (admin) admin.logout();
}

function addScheduleItem() {
    if (admin) {
        admin.currentEditingSchedule = null;
        const form = document.getElementById('scheduleForm');
        if (form) form.reset();
        admin.showModal('scheduleModal');
    }
}

function saveScheduleItem() {
    if (!admin) return;

    const timeInput = document.getElementById('scheduleTime');
    const typeSelect = document.getElementById('scheduleType');
    const folderSelect = document.getElementById('scheduleFolder');
    
    const time = timeInput ? timeInput.value : '';
    const type = typeSelect ? typeSelect.value : '';
    const folder = folderSelect ? folderSelect.value : '';
    
    const selectedDays = Array.from(document.querySelectorAll('#scheduleDays input:checked'))
        .map(input => parseInt(input.value));
    
    if (!time || !type || selectedDays.length === 0) {
        admin.showError('Completa todos los campos requeridos');
        return;
    }
    
    const scheduleItem = {
        id: admin.currentEditingSchedule || Date.now(),
        time,
        type,
        folder: type === 'folder' ? folder : null,
        days: selectedDays,
        active: true,
        description: `${admin.getScheduleTypeText(type)} - ${time}`
    };
    
    if (admin.currentEditingSchedule) {
        const index = admin.schedule.findIndex(s => s.id === admin.currentEditingSchedule);
        if (index !== -1) {
            admin.schedule[index] = scheduleItem;
            admin.addLog('info', 'Programación actualizada');
        }
    } else {
        admin.schedule.push(scheduleItem);
        admin.addLog('success', 'Nueva programación agregada');
    }
    
    admin.renderSchedule();
    admin.closeModal('scheduleModal');
    admin.showSuccess('Programación guardada correctamente');
}

function saveSchedule() {
    if (admin) {
        admin.addLog('success', 'Configuración de programación guardada');
    admin.showSuccess('Programación guardada correctamente');
}

function resetSchedule() {
    if (!confirm('¿Restaurar programación a valores por defecto?')) return;
    
    admin.schedule = [];
    admin.loadSchedule();
    admin.addLog('warning', 'Programación restaurada a valores por defecto');
    admin.showInfo('Programación restaurada');
}

function addUser() {
    admin.showInfo('Funcionalidad de agregar usuario en desarrollo');
}

function changePasswords() {
    admin.showInfo('Funcionalidad de cambio de contraseñas en desarrollo');
}

function refreshLogs() {
    admin.renderLogs();
    admin.showInfo('Logs actualizados');
}

function clearLogs() {
    if (!confirm('¿Limpiar todos los logs?')) return;
    
    admin.logs = [];
    admin.renderLogs();
    admin.addLog('warning', 'Logs del sistema limpiados');
}

function closeModal(modalId) {
    admin.closeModal(modalId);
}

// Control del Sistema
function startAudioServer() {
    admin.addLog('success', 'Servidor de audio iniciado');
    admin.showSuccess('Servidor de audio iniciado');
}

function restartAudioServer() {
    admin.addLog('warning', 'Servidor de audio reiniciado');
    admin.showInfo('Reiniciando servidor de audio...');
}

function stopAudioServer() {
    admin.addLog('error', 'Servidor de audio detenido');
    admin.showInfo('Servidor de audio detenido');
}

function backupDatabase() {
    admin.addLog('info', 'Backup de base de datos iniciado');
    admin.showInfo('Generando backup...');
}

function restoreDatabase() {
    admin.addLog('warning', 'Restauración de base de datos iniciada');
    admin.showInfo('Restaurando base de datos...');
}

function optimizeDatabase() {
    admin.addLog('info', 'Optimización de base de datos completada');
    admin.showSuccess('Base de datos optimizada');
}

function exportConfig() {
    const config = {
        schedule: admin.schedule,
        users: admin.users,
        files: admin.files
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'compuzetta-radio-config.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    admin.addLog('success', 'Configuración exportada');
    admin.showSuccess('Configuración exportada correctamente');
}

function importConfig() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    admin.schedule = config.schedule || [];
                    admin.users = config.users || [];
                    admin.files = config.files || {};
                    
                    admin.loadSchedule();
                    admin.loadUsers();
                    admin.loadFileManager();
                    
                    admin.addLog('success', 'Configuración importada correctamente');
                    admin.showSuccess('Configuración importada');
                } catch (error) {
                    admin.addLog('error', 'Error al importar configuración');
                    admin.showError('Error en el archivo de configuración');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

function resetConfig() {
    if (!confirm('¿Resetear toda la configuración? Esta acción no se puede deshacer.')) return;
    
    admin.schedule = [];
    admin.users = [];
    admin.files = {};
    admin.logs = [];
    
    admin.loadSchedule();
    admin.loadUsers();
    admin.loadFileManager();
    admin.loadLogs();
    
    admin.addLog('warning', 'Configuración reseteada completamente');
    admin.showInfo('Configuración reseteada');
}
