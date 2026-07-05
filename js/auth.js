// Admin semilla: garantiza un acceso inicial sin depender de un registro previo
function seedDefaultAdmin() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (!users.some(u => u.username === 'admin')) {
        users.push({ fullname: 'Administrador', username: 'admin', password: 'admin123', rol: 'admin' });
        localStorage.setItem('users', JSON.stringify(users));
    }
}
seedDefaultAdmin();

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const fullname = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.some(u => u.username === username)) {
            notify.err('El nombre de usuario ya está registrado.');
            return;
        }

        users.push({ fullname, username, password, rol: 'asesor' });
        localStorage.setItem('users', JSON.stringify(users));
        notify.ok('Registro exitoso. Ahora puede iniciar sesión.');
        setTimeout(() => window.location.href = 'login.html', 900);
    });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const userInp = document.getElementById('username').value.trim();
        const passInp = document.getElementById('password').value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const validUser = users.find(u => u.username === userInp && u.password === passInp);

        if (validUser) {
            sessionStorage.setItem('activeUser', JSON.stringify(validUser));
            window.location.href = 'simulador-credito.html';
        } else {
            notify.err('Usuario o contraseña incorrectos.');
        }
    });
}
