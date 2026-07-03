// Al cargar la página, verificamos si hay sesión
document.addEventListener('DOMContentLoaded', () => {
    const activeUser = JSON.parse(sessionStorage.getItem('activeUser'));
    const welcomeText = document.getElementById('welcome-user');

    if (activeUser) {
        if (welcomeText) welcomeText.innerText = `Asesor: ${activeUser.fullname}`;
    } else {
        // Si no hay usuario y no estamos en login/registro, redirigir
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('registro.html')) {
            window.location.href = 'login.html';
        }
    }
});

function logout() {
    sessionStorage.removeItem('activeUser');
    window.location.href = 'login.html';
}