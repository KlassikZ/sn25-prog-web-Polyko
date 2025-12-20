// js/staff-management.js
class StaffManager {
    constructor() {
        this.currentStaff = [];
        this.isDeleteMode = false;
        this.editingStaffId = null;
        
        this.init();
    }
    
    init() {
        this.loadStaffData();
        this.setupEventListeners();
        this.checkAccessLevel();
        this.renderStaff();
        this.updateStats();
    }
    
    checkAccessLevel() {
        const user = JSON.parse(sessionStorage.getItem('ibki_user'));
        if (user && user.level === 4) {
            document.getElementById('managementPanel').style.display = 'block';
        }
    }
    
    loadStaffData() {
        // Загружаем из localStorage или используем начальные данные
        const savedStaff = localStorage.getItem('ibki_staff_data');
        
        if (savedStaff) {
            this.currentStaff = JSON.parse(savedStaff);
        } else {
            // Начальные данные (из оригинального кода)
            this.currentStaff = [
                {
                    id: 'ГЕН-01-АЛЬФА',
                    name: 'Доктор Александр Волков',
                    position: 'ГЛАВНЫЙ ГЕНЕТИК, РУКОВОДИТЕЛЬ ПРОЕКТА',
                    level: 4,
                    status: 'present',
                    biometrics: 'ДНК-профиль 784-AΩ, отпечатки пальцев зарегистрированы',
                    workDuration: '3 года 4 месяца',
                    achievements: 'Доктор биологических наук, лауреат премии Правительства РФ...',
                    personalNote: 'Волков настаивает на ускорении тестов...',
                    photo: 'images/staff/geneticist.jpg',
                    lastAccess: 'Сегодня, 08:30'
                }
                // Добавьте остальных начальных сотрудников...
            ];
            this.saveStaffData();
        }
    }
    
    saveStaffData() {
        localStorage.setItem('ibki_staff_data', JSON.stringify(this.currentStaff));
        this.updateStats();
    }
    
    setupEventListeners() {
        // Кнопки панели управления
        document.getElementById('addStaffBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('deleteModeBtn').addEventListener('click', () => this.toggleDeleteMode());
        document.getElementById('saveAllBtn').addEventListener('click', () => this.saveStaffData());
        
        // Модальное окно
        document.getElementById('closeStaffModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelStaffBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('saveStaffBtn').addEventListener('click', () => this.saveStaff());
        document.getElementById('deleteStaffBtn').addEventListener('click', () => this.deleteStaff());
        
        // Закрытие по клику вне окна
        document.getElementById('staffModal').addEventListener('click', (e) => {
            if (e.target.id === 'staffModal') this.closeModal();
        });
        
        // Escape для закрытия
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('staffModal').style.display === 'block') {
                this.closeModal();
            }
        });
    }
    
    openAddModal(staffId = null) {
        this.editingStaffId = staffId;
        const modal = document.getElementById('staffModal');
        const form = document.getElementById('staffForm');
        
        if (staffId) {
            // Режим редактирования
            document.getElementById('modalTitle').textContent = 'РЕДАКТИРОВАНИЕ СОТРУДНИКА';
            document.getElementById('deleteStaffBtn').style.display = 'inline-block';
            
            const staff = this.currentStaff.find(s => s.id === staffId);
            if (staff) {
                document.getElementById('staffId').value = staff.id;
                document.querySelector(`input[name="accessLevel"][value="${staff.level}"]`).checked = true;
                document.querySelector(`input[name="status"][value="${staff.status}"]`).checked = true;
                document.getElementById('staffName').value = staff.name;
                document.getElementById('biometricData').value = staff.biometrics || '';
                document.getElementById('position').value = staff.position;
                document.getElementById('workDuration').value = staff.workDuration || '';
                document.getElementById('achievements').value = staff.achievements;
                document.getElementById('personalNote').value = staff.personalNote || '';
                document.getElementById('photoUrl').value = staff.photo || '';
            }
        } else {
            // Режим добавления
            document.getElementById('modalTitle').textContent = 'НОВЫЙ СОТРУДНИК';
            document.getElementById('deleteStaffBtn').style.display = 'none';
            form.reset();
            document.querySelector('input[name="accessLevel"][value="1"]').checked = true;
            document.querySelector('input[name="status"][value="present"]').checked = true;
            
            // Генерация ID по умолчанию
            const nextId = this.generateStaffId();
            document.getElementById('staffId').value = nextId;
        }
        
        modal.style.display = 'block';
        document.getElementById('staffId').focus();
    }
    
    closeModal() {
        document.getElementById('staffModal').style.display = 'none';
        document.getElementById('formErrors').style.display = 'none';
        this.editingStaffId = null;
    }
    
    generateStaffId() {
        const prefixes = ['ГЕН', 'БИО', 'ТЕХ', 'АДМ', 'ОХР', 'ИСС', 'ЛАБ'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(Math.random() * 90) + 10;
        const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        return `${prefix}-${number}-${suffix}`;
    }
    
    validateForm() {
        const errors = [];
        const form = document.getElementById('staffForm');
        
        if (!form.staffId.value.match(/^[A-ZА-Я]{3}-[0-9]{2,3}-[A-ZА-Я0-9]{3,5}$/)) {
            errors.push('Идентификатор должен соответствовать формату: XXX-00-XXXXX');
        }
        
        if (!form.staffName.value.trim()) {
            errors.push('Введите имя сотрудника');
        }
        
        if (!form.position.value.trim()) {
            errors.push('Введите должность сотрудника');
        }
        
        if (!form.achievements.value.trim()) {
            errors.push('Введите достижения сотрудника');
        }
        
        // Проверка на дубликат ID (только при добавлении)
        if (!this.editingStaffId) {
            const existingId = this.currentStaff.find(s => s.id === form.staffId.value);
            if (existingId) {
                errors.push('Сотрудник с таким идентификатором уже существует');
            }
        }
        
        return errors;
    }
    
    saveStaff() {
        const errors = this.validateForm();
        
        if (errors.length > 0) {
            const errorEl = document.getElementById('formErrors');
            errorEl.innerHTML = errors.map(e => `<p>⚠️ ${e}</p>`).join('');
            errorEl.style.display = 'block';
            return;
        }
        
        const form = document.getElementById('staffForm');
        const staffData = {
            id: form.staffId.value.trim().toUpperCase(),
            name: form.staffName.value.trim(),
            position: form.position.value.trim(),
            level: parseInt(document.querySelector('input[name="accessLevel"]:checked').value),
            status: document.querySelector('input[name="status"]:checked').value,
            biometrics: form.biometricData.value.trim(),
            workDuration: form.workDuration.value.trim(),
            achievements: form.achievements.value.trim(),
            personalNote: form.personalNote.value.trim(),
            photo: form.photoUrl.value.trim() || 'images/staff/default.jpg',
            lastAccess: new Date().toLocaleString('ru-RU')
        };
        
        if (this.editingStaffId) {
            // Обновляем существующего сотрудника
            const index = this.currentStaff.findIndex(s => s.id === this.editingStaffId);
            if (index !== -1) {
                this.currentStaff[index] = staffData;
            }
        } else {
            // Добавляем нового сотрудника
            this.currentStaff.push(staffData);
        }
        
        this.saveStaffData();
        this.renderStaff();
        this.closeModal();
        
        // Уведомление
        this.showNotification(
            this.editingStaffId ? 'Сотрудник обновлен' : 'Новый сотрудник добавлен',
            'success'
        );
    }
    
    deleteStaff() {
        if (!this.editingStaffId) return;
        
        if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
            this.currentStaff = this.currentStaff.filter(s => s.id !== this.editingStaffId);
            this.saveStaffData();
            this.renderStaff();
            this.closeModal();
            
            this.showNotification('Сотрудник удален', 'danger');
        }
    }
    
    toggleDeleteMode() {
        this.isDeleteMode = !this.isDeleteMode;
        const container = document.getElementById('staffContainer');
        const deleteBtn = document.getElementById('deleteModeBtn');
        
        if (this.isDeleteMode) {
            container.classList.add('delete-mode');
            deleteBtn.innerHTML = '<span class="btn-icon">✅</span> ВЫЙТИ ИЗ РЕЖИМА';
            deleteBtn.style.background = 'linear-gradient(to right, #006600, #003300)';
            
            // Добавляем checkbox на карточки
            this.addDeleteCheckboxes();
        } else {
            container.classList.remove('delete-mode');
            deleteBtn.innerHTML = '<span class="btn-icon">🗑️</span> РЕЖИМ УДАЛЕНИЯ';
            deleteBtn.style.background = '';
            
            // Удаляем выбранных сотрудников
            this.deleteSelectedStaff();
        }
    }
    
    addDeleteCheckboxes() {
        const cards = document.querySelectorAll('.staff-card');
        cards.forEach(card => {
            let checkbox = card.querySelector('.delete-checkbox');
            if (!checkbox) {
                checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'delete-checkbox';
                card.appendChild(checkbox);
            }
            
            checkbox.addEventListener('change', () => {
                card.classList.toggle('selected', checkbox.checked);
            });
        });
    }
    
    deleteSelectedStaff() {
        const selectedCards = document.querySelectorAll('.delete-checkbox:checked');
        if (selectedCards.length === 0) return;
        
        if (confirm(`Удалить ${selectedCards.length} сотрудников?`)) {
            selectedCards.forEach(checkbox => {
                const card = checkbox.closest('.staff-card');
                const staffId = card.dataset.staffId;
                this.currentStaff = this.currentStaff.filter(s => s.id !== staffId);
            });
            
            this.saveStaffData();
            this.renderStaff();
            this.showNotification(`Удалено сотрудников: ${selectedCards.length}`, 'danger');
        }
    }
    
    renderStaff() {
        const container = document.getElementById('staffContainer');
        container.innerHTML = '';
        
        this.currentStaff.forEach(staff => {
            const card = this.createStaffCard(staff);
            container.appendChild(card);
        });
    }
    
    createStaffCard(staff) {
        const card = document.createElement('article');
        card.className = 'staff-card';
        card.dataset.staffId = staff.id;
        
        // Определяем цвет уровня доступа
        let levelColor = '#80ff80';
        let levelClass = 'level-1';
        if (staff.level === 2) {
            levelColor = '#00ffea';
            levelClass = 'level-2';
        } else if (staff.level === 3) {
            levelColor = '#ffaa00';
            levelClass = 'level-3';
        } else if (staff.level === 4) {
            levelColor = '#ff6666';
            levelClass = 'level-4';
        }
        
        card.innerHTML = `
            <div class="staff-card-header">
                <div class="staff-id">
                    <span class="id-label">ИДЕНТИФИКАТОР:</span>
                    <span class="id-value">${staff.id}</span>
                </div>
                <div class="staff-clearance">
                    <span class="clearance-badge ${levelClass}">ДОПУСК: LEVEL-${staff.level}</span>
                </div>
            </div>
            
            <div class="staff-card-body">
                <div class="staff-photo">
                    <img src="${staff.photo}" alt="${staff.name}" 
                         loading="lazy" 
                         onerror="this.src='images/staff/default.jpg'">
                    <div class="photo-overlay">
                        <div class="status-badge ${staff.status === 'present' ? 'present' : 'absent'}">
                            <span class="status-dot"></span>
                            <span class="status-text">
                                ${staff.status === 'present' ? 'НА МЕСТЕ' : 'ОТСУТСТВУЕТ'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="staff-info">
                    <h3 class="staff-name">${staff.name}</h3>
                    <p class="staff-position">${staff.position}</p>
                    
                    <div class="staff-stats">
                        <div class="stat">
                            <span class="stat-label">В проекте:</span>
                            <span class="stat-value">${staff.workDuration}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Последний доступ:</span>
                            <span class="stat-value">${staff.lastAccess}</span>
                        </div>
                    </div>
                    
                    <div class="staff-bio">
                        <h4>РЕГАЛИИ И ДОСТИЖЕНИЯ:</h4>
                        <p>${staff.achievements}</p>
                    </div>
                    
                    ${staff.biometrics ? `
                    <div class="staff-bio">
                        <h4>БИОМЕТРИЧЕСКИЕ ДАННЫЕ:</h4>
                        <p>${staff.biometrics}</p>
                    </div>
                    ` : ''}
                    
                    ${staff.personalNote ? `
                    <div class="staff-note">
                        <h4>ЛИЧНАЯ ЗАМЕТКА ИЗ ДОСЬЕ:</h4>
                        <p class="note-content">${staff.personalNote}</p>
                    </div>
                    ` : ''}
                    
                    <div class="staff-actions">
                        <button class="edit-btn" data-id="${staff.id}">
                            <span class="btn-icon">✏️</span> РЕДАКТИРОВАТЬ
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем обработчик для кнопки редактирования
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openAddModal(staff.id);
            });
        }
        
        // Добавляем обработчик для двойного клика (быстрое редактирование)
        card.addEventListener('dblclick', () => {
            const user = JSON.parse(sessionStorage.getItem('ibki_user'));
            if (user && user.level === 4) {
                this.openAddModal(staff.id);
            }
        });
        
        return card;
    }
    
    updateStats() {
        const total = this.currentStaff.length;
        const present = this.currentStaff.filter(s => s.status === 'present').length;
        const absent = total - present;
        
        document.getElementById('totalStaffCount').textContent = total;
        document.getElementById('presentStaffCount').textContent = present;
        document.getElementById('absentStaffCount').textContent = absent;
    }
    
    showNotification(message, type = 'info') {
        // Удаляем старые уведомления
        const oldNotification = document.querySelector('.staff-notification');
        if (oldNotification) oldNotification.remove();
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `staff-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'success' ? '✅' : '⚠️'}</span>
            <span class="notification-text">${message}</span>
        `;
        
        // Стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 100, 0, 0.9)' : 'rgba(100, 0, 0, 0.9)'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            border: 1px solid ${type === 'success' ? '#80ff80' : '#ff6666'};
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s, fadeOut 0.3s 2.7s;
        `;
        
        // Анимации
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 3 секунды
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем уровень доступа
    const user = JSON.parse(sessionStorage.getItem('ibki_user'));
    if (user && user.level === 4) {
        window.staffManager = new StaffManager();
    }
});