// js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию на всех страницах кроме login.html
    if (!window.location.pathname.includes('login.html')) {
        checkAuthentication();
    }
    
    // Остальной ваш код...
});

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
        }
    }
    
    if (accessLight) {
        accessLight.classList.add('active');
    }
    
    // Скрываем/показываем элементы навигации
    const navItems = document.querySelectorAll('.main-nav a');
    navItems.forEach(item => {
        const page = item.getAttribute('href');
        
        // Проверяем доступ к каждой странице
        if (!checkIfUserCanAccessPage(level, page)) {
            item.style.display = 'none';
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
    
    return pageAccess[level] && pageAccess[level].includes(page.replace('./', ''));
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