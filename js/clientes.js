const modal = document.getElementById('client-modal');
const form = document.getElementById('client-form');
const idInput = document.getElementById('client-id');
let editingId = null; // null = crear, id = editar

function openModal(client) {
    editingId = client ? client.id : null;
    form.reset();
    document.getElementById('modal-title').textContent = client ? 'Editar cliente' : 'Nuevo cliente';
    document.getElementById('modal-subtitle').textContent = client
        ? 'Actualiza la información del cliente'
        : 'Ingresa los datos del nuevo prospecto';

    // El consentimiento solo se pide al registrar, no al editar
    document.getElementById('consent-block').style.display = client ? 'none' : 'block';
    document.getElementById('consent-simulacion').required = !client;

    // El DNI es la llave: no se puede cambiar al editar
    idInput.disabled = !!client;

    if (client) {
        idInput.value = client.id;
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-email').value = client.email;
        document.getElementById('client-phone').value = client.phone;
        document.getElementById('client-phone2').value = client.phone2 || '';
        document.getElementById('client-income').value = client.income ? formatMoney(client.income) : '';
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    (client ? document.getElementById('client-name') : idInput).focus();
}

function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    editingId = null;
}

document.getElementById('btn-new-client').addEventListener('click', () => openModal(null));
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    const id = idInput.value.trim();

    const data = {
        id,
        name: document.getElementById('client-name').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        phone2: document.getElementById('client-phone2').value.trim(),
        income: parseMoney(document.getElementById('client-income').value) || 0
    };

    if (editingId) {
        const i = clients.findIndex(c => c.id === editingId);
        if (i === -1) return;
        clients[i] = { ...clients[i], ...data };
        localStorage.setItem('system_clients', JSON.stringify(clients));
        notify.ok('Cliente actualizado correctamente.');
    } else {
        // Consentimiento obligatorio por Ley N° 29733 de Protección de Datos
        if (!document.getElementById('consent-simulacion').checked) {
            notify.err('El cliente debe aceptar el tratamiento de sus datos.');
            return;
        }
        if (clients.find(c => c.id === id)) {
            notify.err('Este documento ya se encuentra registrado.');
            return;
        }
        data.consent = {
            simulacion: true,
            difusion: document.getElementById('consent-difusion').checked,
            partners: document.getElementById('consent-partners').checked
        };
        clients.push(data);
        localStorage.setItem('system_clients', JSON.stringify(clients));
        notify.ok('Cliente registrado con éxito.');
    }

    closeModal();
    renderClients(document.getElementById('client-search').value.trim().toLowerCase());
});

document.getElementById('client-search').addEventListener('input', (e) => {
    renderClients(e.target.value.trim().toLowerCase());
});

function renderClients(query = '') {
    const tbody = document.querySelector('#table-clients-history tbody');
    if (!tbody) return;

    let clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    if (query) {
        clients = clients.filter(c =>
            c.id.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
        );
    }
    const currencySign = (localStorage.getItem('system_currency') || 'PEN') === 'PEN' ? 'S/' : '$';
    tbody.innerHTML = '';

    if (clients.length === 0) {
        if (query) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:26px;">No hay clientes que coincidan con la búsqueda.</td></tr>`;
        } else {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
                <div class="empty-state-icon"><i class="hgi-stroke hgi-user-group"></i></div>
                <strong>Aún no hay clientes registrados</strong>
                <p>Registra tu primer cliente para empezar a simular créditos vehiculares.</p>
                <button type="button" class="btn-login btn-inline" id="empty-new-client"><i class="hgi-stroke hgi-add-01"></i> Registrar primer cliente</button>
            </div></td></tr>`;
            const btn = document.getElementById('empty-new-client');
            if (btn) btn.addEventListener('click', () => openModal(null));
        }
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
            <td><button class="btn-secondary btn-inline" data-dni="${c.id}"><i class="hgi-stroke hgi-edit-02"></i> Editar</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => openModal(c));
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => renderClients());

attachMoneyFormat(document.getElementById('client-income'));
attachValidation(idInput, document.getElementById('err-client-id'), validators.dni);
attachValidation(document.getElementById('client-email'), document.getElementById('err-client-email'), validators.email);
attachValidation(document.getElementById('client-phone'), document.getElementById('err-client-phone'), validators.phone);
attachValidation(document.getElementById('client-income'), document.getElementById('err-client-income'), validators.positive);
