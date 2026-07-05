// Layout base: sidebar + topbar compartidos en las páginas internas (sin framework)
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    let page = path.substring(path.lastIndexOf('/') + 1) || 'simulador-credito.html';
    if (page === 'login.html' || page === 'registro.html') return;

    const NAV = [
        { href: 'simulador-credito.html', label: 'Créditos', icon: 'hgi-invoice-01' },
        { href: 'registro-cliente.html', label: 'Clientes', icon: 'hgi-user-multiple' },
        { href: 'gestion-vehiculos.html', label: 'Vehículos', icon: 'hgi-car-01' },
        { href: 'gestion-entidades.html', label: 'Entidades', icon: 'hgi-bank' },
        { href: 'configuracion.html', label: 'Configuración', icon: 'hgi-settings-01' }
    ];

    const user = JSON.parse(sessionStorage.getItem('activeUser') || 'null');
    const userName = user ? user.fullname : 'Asesor';
    if (user && user.rol === 'admin') {
        NAV.push({ href: 'gestion-admin.html', label: 'Admin', icon: 'hgi-shield-01' });
    }
    const roleLabel = user && user.rol === 'admin' ? 'Administrador' : 'Asesor';
    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML =
        '<div class="sidebar-brand"><span class="brand-mark"><i class="hgi-stroke hgi-car-01"></i></span><span class="brand-text">Crédito Vehicular</span></div>' +
        '<nav class="sidebar-nav">' +
        NAV.map(n => `<a href="${n.href}" class="sidebar-link${n.href === page ? ' active' : ''}"><i class="hgi-stroke ${n.icon}"></i><span>${n.label}</span></a>`).join('') +
        '</nav>' +
        '<div class="sidebar-footer">' +
        `<div class="sidebar-user"><span class="sidebar-avatar">${userName.charAt(0).toUpperCase()}</span><span class="sidebar-user-meta"><strong>${userName}</strong><small>${roleLabel}</small></span></div>` +
        '<button class="sidebar-logout" id="app-logout"><i class="hgi-stroke hgi-logout-01"></i><span>Cerrar sesión</span></button>' +
        '</div>';

    const oldHeader = document.querySelector('.main-header');
    if (oldHeader) oldHeader.remove();

    document.body.classList.add('has-sidebar');
    document.body.prepend(sidebar);

    document.getElementById('app-logout').addEventListener('click', () => {
        if (window.logout) logout();
        else { sessionStorage.removeItem('activeUser'); location.href = 'login.html'; }
    });
});
