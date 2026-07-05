// Layout base: sidebar + topbar compartidos en las páginas internas (sin framework)
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    let page = path.substring(path.lastIndexOf('/') + 1) || 'simulador.html';
    if (page === 'login.html' || page === 'registro.html') return;

    const NAV = [
        { href: 'simulador.html', label: 'Inicio', icon: 'hgi-home-01' },
        { href: 'registro-cliente.html', label: 'Clientes', icon: 'hgi-user-multiple' },
        { href: 'simulador-credito.html', label: 'Créditos', icon: 'hgi-invoice-01' },
        { href: 'gestion-vehiculos.html', label: 'Vehículos', icon: 'hgi-car-01' },
        { href: 'gestion-entidades.html', label: 'Entidades', icon: 'hgi-bank' },
        { href: 'configuracion.html', label: 'Configuración', icon: 'hgi-settings-01' }
    ];

    const user = JSON.parse(sessionStorage.getItem('activeUser') || 'null');
    const userName = user ? user.fullname : 'Asesor';
    const current = NAV.find(n => n.href === page);

    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';
    sidebar.innerHTML =
        '<div class="sidebar-brand"><span class="brand-mark"><i class="hgi-stroke hgi-car-01"></i></span><span class="brand-text">Crédito Vehicular</span></div>' +
        '<nav class="sidebar-nav">' +
        NAV.map(n => `<a href="${n.href}" class="sidebar-link${n.href === page ? ' active' : ''}"><i class="hgi-stroke ${n.icon}"></i><span>${n.label}</span></a>`).join('') +
        '</nav>' +
        '<button class="sidebar-logout" id="app-logout"><i class="hgi-stroke hgi-logout-01"></i><span>Cerrar sesión</span></button>';

    const topbar = document.createElement('header');
    topbar.className = 'app-topbar';
    topbar.innerHTML =
        `<div class="topbar-title">${current ? current.label : 'Panel'}</div>` +
        `<div class="topbar-user"><span class="topbar-avatar">${userName.charAt(0).toUpperCase()}</span><span>${userName}</span></div>`;

    const oldHeader = document.querySelector('.main-header');
    if (oldHeader) oldHeader.remove();

    document.body.classList.add('has-sidebar');
    document.body.prepend(sidebar);

    const main = document.querySelector('main');
    if (main) main.parentNode.insertBefore(topbar, main);
    else document.body.appendChild(topbar);

    document.getElementById('app-logout').addEventListener('click', () => {
        if (window.logout) logout();
        else { sessionStorage.removeItem('activeUser'); location.href = 'login.html'; }
    });
});
