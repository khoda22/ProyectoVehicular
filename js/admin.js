document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(sessionStorage.getItem('activeUser') || 'null');
    if (!user || user.rol !== 'admin') {
        notify.err('Acceso exclusivo para administradores.');
        setTimeout(() => location.href = 'simulador-credito.html', 1300);
        return;
    }
    renderUsers();
});

document.getElementById('admin-user-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('au-username').value.trim();
    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.some(u => u.username === username)) {
        notify.err('Ese nombre de usuario ya existe.');
        return;
    }

    users.push({
        fullname: document.getElementById('au-fullname').value.trim(),
        username,
        password: document.getElementById('au-password').value,
        rol: document.getElementById('au-rol').value
    });
    localStorage.setItem('users', JSON.stringify(users));
    notify.ok('Usuario creado con éxito.');
    e.target.reset();
    renderUsers();
});

function renderUsers() {
    const tbody = document.querySelector('#table-users tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const users = JSON.parse(localStorage.getItem('users')) || [];

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.fullname}</td>
            <td style="font-weight:600;">${u.username}</td>
            <td><span style="text-transform:capitalize;">${u.rol || 'asesor'}</span></td>
            <td><button class="btn-secondary" style="padding:6px 14px;">Eliminar</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => deleteUser(u.username));
        tbody.appendChild(tr);
    });
}

function deleteUser(username) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const target = users.find(u => u.username === username);
    const admins = users.filter(u => u.rol === 'admin');

    if (target && target.rol === 'admin' && admins.length <= 1) {
        notify.err('No puede eliminar al único administrador del sistema.');
        return;
    }
    if (!confirm(`¿Eliminar al usuario "${username}"?`)) return;

    users = users.filter(u => u.username !== username);
    localStorage.setItem('users', JSON.stringify(users));
    notify.ok('Usuario eliminado.');
    renderUsers();
}

function clearData(key, label) {
    if (!confirm(`¿Eliminar todos los ${label}? Esta acción no se puede deshacer.`)) return;
    localStorage.removeItem(key);
    notify.ok(`${label.charAt(0).toUpperCase() + label.slice(1)} eliminados.`);
}

document.getElementById('btn-clear-clients').addEventListener('click', () => clearData('system_clients', 'clientes'));
document.getElementById('btn-clear-vehicles').addEventListener('click', () => clearData('system_vehicles', 'vehículos'));
document.getElementById('btn-clear-sims').addEventListener('click', () => clearData('system_simulations', 'simulaciones'));

document.getElementById('btn-reset-all').addEventListener('click', () => {
    if (!confirm('¿Restablecer TODO el sistema (clientes, vehículos y simulaciones)? No se puede deshacer.')) return;
    ['system_clients', 'system_vehicles', 'system_simulations'].forEach(k => localStorage.removeItem(k));
    notify.ok('Sistema restablecido correctamente.');
});
