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

        for (let i = 0;

XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX


