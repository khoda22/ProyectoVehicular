// --- REGISTRAR CLIENTE ---
document.getElementById('client-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newClient = {
        id: document.getElementById('client-id').value.trim(),
        name: document.getElementById('client-name').value.trim(),
        email: document.getElementById('client-email').value.trim(),
        phone: document.getElementById('client-phone').value.trim(),
        income: parseFloat(document.getElementById('client-income').value)
    };

    const clients = JSON.parse(localStorage.getItem('system_clients')) || [];

    if (clients.find(c => c.id === newClient.id)) {
        alert('Este documento ya se encuentra registrado.');
        return;
    }

    clients.push(newClient);
    localStorage.setItem('system_clients', JSON.stringify(clients));

    alert('Cliente registrado con éxito.');
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
        document.getElementById('edit-name').value = clientToEdit.name;
        document.getElementById('edit-email').value = clientToEdit.email;
        document.getElementById('edit-phone').value = clientToEdit.phone;
        document.getElementById('edit-income').value = clientToEdit.income;
        toggleFields(true);
        resultsPanel.style.display = 'block';
    } else {
        resultsPanel.style.display = 'none';
        alert('No se encontró ningún cliente con ese DNI.');
    }
});

document.getElementById('btn-enable-edit').addEventListener('click', () => {
    toggleFields(false);
});

document.getElementById('btn-save-edit').addEventListener('click', () => {
    let clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    const index = clients.findIndex(c => c.id === clientToEdit.id);

    if (index !== -1) {
        clients[index].name = document.getElementById('edit-name').value.trim();
        clients[index].email = document.getElementById('edit-email').value.trim();
        clients[index].phone = document.getElementById('edit-phone').value.trim();
        clients[index].income = parseFloat(document.getElementById('edit-income').value);

        localStorage.setItem('system_clients', JSON.stringify(clients));
        alert('Datos del cliente actualizados correctamente.');
        toggleFields(true);
        renderClientsHistory();
    }
});

function toggleFields(isLocked) {
    document.getElementById('edit-name').disabled = isLocked;
    document.getElementById('edit-email').disabled = isLocked;
    document.getElementById('edit-phone').disabled = isLocked;
    document.getElementById('edit-income').disabled = isLocked;

    if (isLocked) {
        document.getElementById('btn-enable-edit').style.display = 'block';
        document.getElementById('btn-save-edit').style.display = 'none';
    } else {
        document.getElementById('btn-enable-edit').style.display = 'none';
        document.getElementById('btn-save-edit').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', renderClientsHistory);

function renderClientsHistory() {
    const tbody = document.querySelector('#table-clients-history tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    const currencySign = (localStorage.getItem('system_currency') || 'PEN') === 'PEN' ? 'S/' : '$';

    if (clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay clientes registrados actualmente.</td></tr>`;
        return;
    }

    clients.forEach(c => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600;">${c.id}</td>
            <td>${c.name}</td>
            <td>${c.email}</td>
            <td>${c.phone || '-'}</td>
            <td>${currencySign} ${c.income.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}
