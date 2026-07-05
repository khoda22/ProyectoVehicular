// Admin semilla: garantiza un acceso inicial sin depender de un registro previo
function seedDefaultAdmin() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.some(u => u.username === 'admin')) {
        users.push({ fullname: 'Administrador', username: 'admin', password: 'admin123', rol: 'admin' });
        localStorage.setItem('users', JSON.stringify(users));
    }
}
seedDefaultAdmin();

// Control de acceso de las páginas públicas de autenticación
(function accessGuard() {
    const page = location.pathname.split('/').pop();
    const user = JSON.parse(sessionStorage.getItem('activeUser') || 'null');
    // Login: si ya hay sesión, no reloguear → ir a la app
    if (page === 'login.html' && user) {
        location.href = 'simulador-credito.html';
    }
    // Registro de usuarios: exclusivo del administrador
    if (page === 'registro.html') {
        if (!user) location.href = 'login.html';
        else if (user.rol !== 'admin') location.href = 'simulador-credito.html';
    }
})();

// Captcha simple (verificación matemática): fachada funcional, sin librerías externas
let captchaAnswer = null;
function generateCaptcha() {
    const qEl = document.getElementById('captcha-question');
    if (!qEl) return;
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    captchaAnswer = a + b;
    qEl.textContent = `${a} + ${b}`;
    const ans = document.getElementById('captcha-answer');
    if (ans) ans.value = '';
}
generateCaptcha();
const captchaRefresh = document.getElementById('captcha-refresh');
if (captchaRefresh) captchaRefresh.addEventListener('click', generateCaptcha);

// "¿Olvidó su contraseña?": sin correo, el restablecimiento lo hace el administrador
const forgotLink = document.getElementById('forgot-link');
if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        notify.info('Contacta al administrador del sistema para restablecer tu contraseña.', 'Recuperación');
    });
}

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const fullname = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;

        const passErr = validators.strongPassword(password);
        if (passErr !== true) { notify.err(passErr); return; }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.username === username)) {
            notify.err('El nombre de usuario ya está registrado.');
            return;
        }

        users.push({ fullname, username, password, rol: 'asesor' });
        localStorage.setItem('users', JSON.stringify(users));
        notify.ok('Usuario creado con éxito.');
        setTimeout(() => window.location.href = 'login.html', 900);
    });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (parseInt(document.getElementById('captcha-answer').value, 10) !== captchaAnswer) {
            notify.err('Verificación incorrecta. Inténtalo de nuevo.');
            generateCaptcha();
            return;
        }

        const userInp = document.getElementById('username').value.trim();
        const passInp = document.getElementById('password').value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const validUser = users.find(u => u.username === userInp && u.password === passInp);

        if (validUser) {
            sessionStorage.setItem('activeUser', JSON.stringify(validUser));
            window.location.href = 'simulador-credito.html';
        } else {
            notify.err('Usuario o contraseña incorrectos.');
            generateCaptcha();
        }
    });
}
