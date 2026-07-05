// --- REGISTRAR CLIENTE ---
document.getElementById('client-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // El consentimiento para simular es obligatorio (Ley N° 29733): sin él no se puede cotizar
    const consent = {
        simulacion: document.getElementById('consent-simulacion').checked,
        difusion: document.getElementById('consent-difusion').checked,
        partners: document.getElementById('consent-partners').checked
    };
    if (!consent.simulacion) {
        notify.err('El cliente debe autorizar el uso de sus datos para la simulación.');
        return;
    }

    const newClient = {
        id: document.getElementById('client-id').value.trim(),
        name: document.getElementById('client-name').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        phone2: document.getElementById('client-phone2').value.trim(),
        income: parseMoney(document.getElementById('client-income').value),
        consent
    };

    const clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    if (clients.find(c => c.id === newClient.id)) {
        notify.err('Este documento ya se encuentra registrado.');
        return;
    }

    clients.push(newClient);
    localStorage.setItem('system_clients', JSON.stringify(clients));
    notify.ok('Cliente registrado con éxito.');
    document.getElementById('client-form').reset();
    renderClientsHistory();
});

// --- BUSCAR CLIENTE ---
let clientToEdit = null;

document.getElementById('btn-search-panel').addEventListener('click', () => {
    const dni = document.getElementById('search-dni').value.trim();
    const clients = JSON.parse(localStorage.getItem('system_clients')) || [];

    clientToEdit = clients.find(c => c.id === dni);
    const resultsPanel = document.getElementById('search-results-panel');

    if (clientToEdit) {
        loadClientIntoEditPanel(clientToEdit);
    } else {
        resultsPanel.style.display = 'none';
        notify.err('No se encontró ningún cliente con ese DNI.');
    }
});

function loadClientIntoEditPanel(client) {
    clientToEdit = client;
    document.getElementById('edit-name').value = client.name;
    document.getElementById('edit-email').value = client.email;
    document.getElementById('edit-phone').value = client.phone;
    document.getElementById('edit-phone2').value = client.phone2 || '';
    document.getElementById('edit-income').value = client.income;
    toggleFields(true);
    document.getElementById('search-results-panel').style.display = 'block';
    document.getElementById('search-results-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('btn-enable-edit').addEventListener('click', () => toggleFields(false));

document.getElementById('btn-save-edit').addEventListener('click', () => {
    let clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    const index = clients.findIndex(c => c.id === clientToEdit.id);

    if (index !== -1) {
        clients[index].name = document.getElementById('edit-name').value.trim();
        clients[index].email = document.getElementById('edit-email').value.trim();
        clients[index].phone = document.getElementById('edit-phone').value.trim();
        clients[index].phone2 = document.getElementById('edit-phone2').value.trim();
        clients[index].income = parseMoney(document.getElementById('edit-income').value);

        localStorage.setItem('system_clients', JSON.stringify(clients));
        notify.ok('Datos del cliente actualizados correctamente.');
        toggleFields(true);
        renderClientsHistory();
    }
});

function toggleFields(isLocked) {
    ['edit-name', 'edit-email', 'edit-phone', 'edit-phone2', 'edit-income']
        .forEach(id => document.getElementById(id).disabled = isLocked);
    document.getElementById('btn-enable-edit').style.display = isLocked ? 'block' : 'none';
    document.getElementById('btn-save-edit').style.display = isLocked ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', renderClientsHistory);

function renderClientsHistory() {
    const tbody = document.querySelector('#table-clients-history tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    const currencySign = (localStorage.getItem('system_currency') || 'PEN') === 'PEN' ? 'S/' : '$';

    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No hay clientes registrados actualmente.</td></tr>`;
        return;
    }

    clients.forEach(c => {
        const consentTxt = c.consent
            ? `Simulación${c.consent.difusion ? ', Difusión' : ''}${c.consent.partners ? ', Partners' : ''}`
            : '-';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600;">${c.id}</td>
            <td>${c.name}</td>
            <td>${c.email}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.phone2 || '-'}</td>
            <td>${currencySign} ${formatMoney(c.income)}</td>
            <td style="font-size:12px;">${consentTxt}</td>
            <td><button class="btn-secondary" style="padding:6px 14px;" data-dni="${c.id}">Editar</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => loadClientIntoEditPanel(c));
        tbody.appendChild(tr);
    });
}

attachMoneyFormat(document.getElementById('client-income'));
attachMoneyFormat(document.getElementById('edit-income'));

// Validación en vivo del formulario de registro
attachValidation(document.getElementById('client-id'), document.getElementById('err-client-id'), validators.dni);
attachValidation(document.getElementById('client-email'), document.getElementById('err-client-email'), validators.email);
attachValidation(document.getElementById('client-phone'), document.getElementById('err-client-phone'), validators.phone);
attachValidation(document.getElementById('client-income'), document.getElementById('err-client-income'), validators.positive);
