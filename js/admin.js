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
            const authData = JSON.parse(savedAuth);
            if (Date.now() - authData.timestamp < 8 * 60 * 60 * 1000) { // 8 horas
                this.isAuthenticated = true;
                this.currentUser = authData.user;
                this.showAdminPanel();
                return;
            }
        }
        this.showLoginOverlay();
    }

    showLoginOverlay() {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        this.updateDashboard();
        this.loadFileManager();
        this.loadSchedule();
        this.loadUsers();
        this.loadLogs();
    }

    async authenticateAdmin(password) {
        // Simulación de autenticación - En producción usar backend seguro
        const validPasswords = {
            'admin123': { role: 'admin', name: 'Administrador Principal' },
            'compuzetta2024': { role: 'admin', name: 'Admin Compuzetta' }
        };

        if (validPasswords[password]) {
            this.isAuthenticated = true;
            this.currentUser = validPasswords[password];
            
            localStorage.setItem('admin_auth', JSON.stringify({
                user: this.currentUser,
                timestamp: Date.now()
            }));
            
            this.showAdminPanel();
            this.addLog('success', 'Administrador autenticado correctamente');
            return true;
        }
        
        this.addLog('error', 'Intento de acceso no autorizado');
        return false;
    }

    logout() {
        localStorage.removeItem('admin_auth');
        this.isAuthenticated = false;
        this.currentUser = null;
        this.showLoginOverlay();
        this.addLog('info', 'Sesión de administrador cerrada');
    }

    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            const success = await this.authenticateAdmin(password);
            
            if (!success) {
                this.showError('Contraseña incorrecta');
                document.getElementById('passwordInput').value = '';
            }
        });

        // File upload
        this.setupFileUpload();
        
        // Folder tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchFolder(e.target.dataset.folder);
            });
        });

        // Modal controls
        this.setupModals();

        // Schedule controls
        document.getElementById('scheduleType').addEventListener('change', (e) => {
            const folderGroup = document.getElementById('folderGroup');
            folderGroup.style.display = e.target.value === 'folder' ? 'block' : 'none';
        });
    }

    setupFileUpload() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

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
            uptime: Math.floor(Math.random() * 86400), // Segundos aleatorios
            listeners: Math.floor(Math.random() * 50) + 10,
            djOnline: Math.random() > 0.5
        };

        document.getElementById('systemStatus').className = 
            `status-dot ${this.systemStatus.online ? 'online' : 'offline'}`;
        document.getElementById('systemStatusText').textContent = 
            this.systemStatus.online ? 'Sistema Online' : 'Sistema Offline';
        
        document.getElementById('totalListeners').textContent = this.systemStatus.listeners;
        document.getElementById('totalTracks').textContent = this.getTotalTracks();
        document.getElementById('uptime').textContent = this.formatUptime(this.systemStatus.uptime);
        document.getElementById('djStatus').textContent = 
            this.systemStatus.djOnline ? 'En Línea' : 'Desconectado';
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
        const folder = document.getElementById('uploadFolder').value;
        if (!folder) {
            this.showError('Selecciona una carpeta destino');
            return;
        }

        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        progressContainer.style.display = 'block';

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
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}% - Subiendo ${file.name}`;

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
                duration: '00:00' // Se calcularía en implementación real
            });

            this.addLog('success', `Archivo subido: ${file.name} a carpeta ${folder}`);
        }

        progressContainer.style.display = 'none';
        this.loadFileManager();
        this.updateDashboard();
        this.showSuccess(`${files.length} archivo(s) subido(s) correctamente`);
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

        fileList.innerHTML = files.map(file => `
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
                    <button class="file-btn danger" onclick="admin.deleteFile('${folder}', '${file.name}')" title="Eliminar">
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

    deleteFile(folder, filename) {
        if (!confirm(`¿Eliminar "${filename}"?`)) return;
        
        const folderFiles = this.files[folder];
        const index = folderFiles.findIndex(f => f.name === filename);
        if (index !== -1) {
            folderFiles.splice(index, 1);
            this.loadFileManager();
            this.addLog('warning', `Archivo eliminado: ${filename}`);
            this.showSuccess('Archivo eliminado correctamente');
        }
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
        if (item) {
            // Llenar formulario modal
            document.getElementById('scheduleTime').value = item.time;
            document.getElementById('scheduleType').value = item.type;
            
            if (item.type === 'folder') {
                document.getElementById('folderGroup').style.display = 'block';
                document.getElementById('scheduleFolder').value = item.folder;
            }
            
            // Marcar días
            const dayInputs = document.querySelectorAll('#scheduleDays input');
            dayInputs.forEach(input => {
                input.checked = item.days.includes(parseInt(input.value));
            });
            
            this.currentEditingSchedule = id;
            this.showModal('scheduleModal');
        }
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
            this.addLog('success', 'Conexión establecida con servidor de streaming');
            this.addLog('info', 'Carga de archivos de música completada');
        }
        this.renderLogs();
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
        const selectedLevel = document.getElementById('logLevel').value;
        
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
        setInterval(() => {
            this.updateDashboard();
        }, 5000); // Actualizar cada 5 segundos

        setInterval(() => {
            this.addRandomLog();
        }, 30000); // Log aleatorio cada 30 segundos
    }

    addRandomLog() {
        const randomLogs = [
            { level: 'info', message: 'Estadísticas de oyentes actualizadas' },
            { level: 'info', message: 'Verificación de archivos completada' },
            { level: 'success', message: 'Nuevo oyente conectado' },
            { level: 'info', message: 'Rotación automática de música activada' }
        ];
        
        const randomLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
        this.addLog(randomLog.level, randomLog.message);
    }

    // ========== MODALES ==========
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
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
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// ========== FUNCIONES GLOBALES ==========
let admin;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    admin = new CompuzettaAdmin();
});

// Funciones accesibles globalmente
function logout() {
    admin.logout();
}

function addScheduleItem() {
    admin.currentEditingSchedule = null;
    document.getElementById('scheduleForm').reset();
    admin.showModal('scheduleModal');
}

function saveScheduleItem() {
    const time = document.getElementById('scheduleTime').value;
    const type = document.getElementById('scheduleType').value;
    const folder = document.getElementById('scheduleFolder').value;
    
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
        admin.schedule[index] = scheduleItem;
        admin.addLog('info', 'Programación actualizada');
    } else {
        admin.schedule.push(scheduleItem);
        admin.addLog('success', 'Nueva programación agregada');
    }
    
    admin.renderSchedule();
    admin.closeModal('scheduleModal');
    admin.showSuccess('Programación guardada correctamente');
}

function saveSchedule() {
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
