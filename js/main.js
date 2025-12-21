// js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию на всех страницах кроме login.html
    if (!window.location.pathname.includes('login.html')) {
        checkAuthentication();
    }
    
    // Инициализация обработчиков для модального окна (если оно есть на странице)
    initModalHandlers();
    
    // Обработчик кликов на ограниченные ссылки (делегирование событий)
    document.addEventListener('click', function(e) {
        const restrictedLink = e.target.closest('a.restricted-link');
        if (restrictedLink) {
            handleRestrictedClick.call(restrictedLink, e);
        }
    });
});

function initModalHandlers() {
    const modal = document.getElementById('accessDeniedModal');
    if (!modal) return;
    
    // Закрытие по крестику
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Закрытие по кнопке "Понятно"
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Кнопка "Попробовать взломать"
    const tryHackBtn = document.getElementById('tryHackBtn');
    if (tryHackBtn) {
        tryHackBtn.addEventListener('click', function() {
            tryHackBtn.textContent = 'ВЗЛОМ...';
            tryHackBtn.disabled = true;
            
            setTimeout(() => {
                tryHackBtn.textContent = 'НЕУДАЧА...';
                tryHackBtn.style.background = 'linear-gradient(to right, #333, #000)';
                
                setTimeout(() => {
                    tryHackBtn.textContent = 'ПОПРОБОВАТЬ ВЗЛОМАТЬ';
                    tryHackBtn.disabled = false;
                    tryHackBtn.style.background = '';
                    modal.style.display = 'none';
                }, 1000);
            }, 2000);
        });
    }
}

function handleRestrictedClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const link = this;
    const page = link.getAttribute('data-original-href');
    const userLevel = auth.getUserLevel();
    
    // Определяем требуемый уровень для этой страницы
    const requiredLevel = getRequiredLevelForPage(page);
    
    // Показываем модальное окно
    showAccessDeniedModal(userLevel, requiredLevel, page);
}

function getRequiredLevelForPage(page) {
    const pageAccess = {
        1: ['index.html', 'building.html'],
        2: ['index.html', 'building.html', 'staff.html'],
        3: ['index.html', 'building.html', 'staff.html', 'blinks.html'],
        4: ['index.html', 'building.html', 'staff.html', 'blinks.html', 'secrets.html']
    };
    
    // Находим минимальный уровень, который имеет доступ к этой странице
    for (let level = 1; level <= 4; level++) {
        if (pageAccess[level] && pageAccess[level].includes(page)) {
            return level;
        }
    }
    
    return 4; // По умолчанию самый высокий уровень
}

function showAccessDeniedModal(currentLevel, requiredLevel, page) {
    const modal = document.getElementById('accessDeniedModal');
    const currentLevelEl = document.getElementById('currentAccessLevel');
    const requiredLevelEl = document.getElementById('requiredAccessLevel');
    
    if (!modal || !currentLevelEl || !requiredLevelEl) {
        console.warn('Модальное окно не найдено на странице');
        return;
    }
    
    // Обновляем информацию
    currentLevelEl.textContent = `LEVEL-${currentLevel}`;
    requiredLevelEl.textContent = `LEVEL-${requiredLevel}`;
    
    // Показываем модальное окно
    modal.style.display = 'block';
    
    // Закрытие по Escape
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function checkAuthentication() {
    const userData = JSON.parse(sessionStorage.getItem('ibki_user'));
    
    if (!userData) {
        // Пользователь не авторизован - перенаправляем на страницу входа
        window.location.href = 'login.html';
        return;
    }
    
    // Обновляем интерфейс в зависимости от уровня доступа
    updateUIForUserLevel(userData.level);
    
    // Проверяем доступ к текущей странице
    checkPageAccess(userData.level);
}

function updateUIForUserLevel(level) {
    // Обновляем бейдж доступа в шапке
    const accessBadge = document.querySelector('.access-badge');
    const accessLight = document.querySelector('.access-light');
    
    if (accessBadge) {
        accessBadge.textContent = `ДОСТУП: LEVEL-${level}`;
        
        // Цвет в зависимости от уровня
        if (level >= 4) {
            accessBadge.style.background = 'rgba(255, 0, 64, 0.3)';
            accessBadge.style.color = '#ff6666';
            accessBadge.style.borderColor = '#ff6666';
        } else if (level >= 3) {
            accessBadge.style.background = 'rgba(255, 165, 0, 0.3)';
            accessBadge.style.color = '#ffaa00';
            accessBadge.style.borderColor = '#ffaa00';
        } else if (level >= 2) {
            accessBadge.style.background = 'rgba(0, 255, 234, 0.3)';
            accessBadge.style.color = '#00ffea';
            accessBadge.style.borderColor = '#00ffea';
        } else {
            // LEVEL-1
            accessBadge.style.background = 'rgba(0, 128, 0, 0.3)';
            accessBadge.style.color = '#80ff80';
            accessBadge.style.borderColor = '#80ff80';
        }
    }
    
    if (accessLight) {
        accessLight.classList.add('active');
    }
    
    // Скрываем/показываем элементы навигации
    const navItems = document.querySelectorAll('.main-nav li');
    navItems.forEach(item => {
        const link = item.querySelector('a');
        const page = link.getAttribute('href');
        
        // Проверяем доступ к каждой странице
        if (!checkIfUserCanAccessPage(level, page)) {
            // Вместо скрытия - делаем недоступной
            item.classList.add('restricted');
            link.classList.add('restricted-link');
            
            // Сохраняем оригинальный href для возможного будущего доступа
            link.setAttribute('data-original-href', page);
            link.href = '#';
            
            // Добавляем иконку замка
            if (!link.querySelector('.lock-icon')) {
                const lockIcon = document.createElement('span');
                lockIcon.className = 'lock-icon';
                lockIcon.innerHTML = '🔒';
                link.appendChild(lockIcon);
            }
            

        } else {
            item.classList.remove('restricted');
            link.classList.remove('restricted-link');
            
            // Восстанавливаем оригинальную ссылку
            if (link.getAttribute('data-original-href')) {
                link.href = link.getAttribute('data-original-href');
            }
            
            // Удаляем иконку замка если есть
            const lockIcon = link.querySelector('.lock-icon');
            if (lockIcon) lockIcon.remove();
            
        }
    });
    
    // Добавляем кнопку выхода
    addLogoutButton();
}

function checkPageAccess(level) {
    const currentPage = window.location.pathname.split('/').pop();
    const pageAccess = {
        1: ['index.html', 'building.html'],
        2: ['index.html', 'building.html', 'staff.html'],
        3: ['index.html', 'building.html', 'staff.html', 'blinks.html'],
        4: ['index.html', 'building.html', 'staff.html', 'blinks.html', 'secrets.html']
    };
    
    if (!pageAccess[level] || !pageAccess[level].includes(currentPage)) {
        // Пользователь пытается получить доступ к запрещенной странице
        showAccessDenied();
        return false;
    }
    
    return true;
}

function checkIfUserCanAccessPage(level, page) {
    const pageAccess = {
        1: ['index.html', 'building.html'],
        2: ['index.html', 'building.html', 'staff.html'],
        3: ['index.html', 'building.html', 'staff.html', 'blinks.html'],
        4: ['index.html', 'building.html', 'staff.html', 'blinks.html', 'secrets.html']
    };
    
    // Удаляем "./" если есть
    const cleanPage = page.replace('./', '');
    return pageAccess[level] && pageAccess[level].includes(cleanPage);
}

function showAccessDenied() {
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #0a0a16;
            color: #ff0040;
            font-family: 'Share Tech Mono', monospace;
            text-align: center;
            padding: 20px;
        ">
            <div>
                <h1 style="font-size: 3rem; margin-bottom: 20px;">⛔ ДОСТУП ЗАПРЕЩЁН</h1>
                <p style="font-size: 1.2rem; margin-bottom: 30px;">
                    Ваш уровень доступа недостаточен для просмотра этой страницы.
                </p>
                <button onclick="window.location.href='index.html'" style="
                    background: #ff0040;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1rem;
                    cursor: pointer;
                    font-family: 'Orbitron', sans-serif;
                ">
                    ВЕРНУТЬСЯ НА ГЛАВНУЮ
                </button>
            </div>
        </div>
    `;
}

function addLogoutButton() {
    // Проверяем, есть ли уже кнопка выхода
    if (document.querySelector('.logout-btn')) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.innerHTML = 'ВЫЙТИ ИЗ СИСТЕМЫ';
    logoutBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(255, 0, 64, 0.2);
        color: #ff6666;
        border: 1px solid #ff6666;
        padding: 10px 15px;
        border-radius: 3px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.8rem;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s;
    `;
    
    logoutBtn.onmouseover = () => {
        logoutBtn.style.background = 'rgba(255, 0, 64, 0.4)';
        logoutBtn.style.boxShadow = '0 0 10px rgba(255, 0, 64, 0.5)';
    };
    
    logoutBtn.onmouseout = () => {
        logoutBtn.style.background = 'rgba(255, 0, 64, 0.2)';
        logoutBtn.style.boxShadow = 'none';
    };
    
    logoutBtn.onclick = () => {
        sessionStorage.removeItem('ibki_user');
        window.location.href = 'login.html';
    };
    
    document.body.appendChild(logoutBtn);
}

// Экспортируем функции для использования в других скриптах
window.auth = {
    checkAuthentication,
    getUserLevel: () => {
        const user = JSON.parse(sessionStorage.getItem('ibki_user'));
        return user ? user.level : 0;
    },
    getUserName: () => {
        const user = JSON.parse(sessionStorage.getItem('ibki_user'));
        return user ? user.name : 'Гость';
    },
    logout: () => {
        sessionStorage.removeItem('ibki_user');
        window.location.href = 'login.html';
    }
};