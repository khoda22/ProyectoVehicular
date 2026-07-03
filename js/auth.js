
// 1. Manejo del Registro
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const fullname = document.getElementById('reg-fullname').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userExists = users.find(u => u.username === username);

        if (userExists) {
            alert("El nombre de usuario ya está registrado.");
        } else {
            users.push({ fullname, username, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert("Registro exitoso. Ahora puede iniciar sesión.");
            window.location.href = "login.html";
        }
    });
}

// 2. Manejo del Login (Este es el único que debe quedar)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const userInp = document.getElementById('username').value;
        const passInp = document.getElementById('password').value;

        // Traemos la lista de usuarios del almacenamiento del navegador
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Buscamos si existe coincidencia
        const validUser = users.find(u => u.username === userInp && u.password === passInp);

        if (validUser) {
            sessionStorage.setItem('activeUser', JSON.stringify(validUser));
            alert(`¡Bienvenido, ${validUser.fullname}!`);
            window.location.href = "simulador.html";
        } else {
            // Un pequeño tip: si quieres seguir usando admin/1234 sin registrarlo, 
            // podrías agregarlo como una condición extra aquí.
            if(userInp === "admin" && passInp === "1234") {
                alert("¡Bienvenido, Administrador!");
                window.location.href = "simulador.html";
            } else {
                alert("Usuario o contraseña incorrectos.");
            }
        }
    });
}