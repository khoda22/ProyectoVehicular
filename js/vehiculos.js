// --- REGISTRAR VEHÍCULO ---
document.getElementById('vehicle-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newVehicle = {
        id: document.getElementById('car-id').value.trim().toUpperCase(),
        brand: document.getElementById('car-brand').value.trim(),
        model: document.getElementById('car-model').value.trim(),
        year: parseInt(document.getElementById('car-year').value),
        priceSoles: parseMoney(document.getElementById('car-price-pen').value),
        priceDollars: parseMoney(document.getElementById('car-price-usd').value)
    };

    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    if (vehicles.find(v => v.id === newVehicle.id)) {
        notify.err('Este código de vehículo ya existe.');
        return;
    }

    vehicles.push(newVehicle);
    localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
    notify.ok('Vehículo añadido al inventario con éxito.');
    document.getElementById('vehicle-form').reset();
    renderVehiclesHistory();
});

// --- BUSCAR VEHÍCULO ---
let vehicleToEdit = null;

document.getElementById('btn-search-car-panel').addEventListener('click', () => {
    const code = document.getElementById('search-car-code').value.trim().toUpperCase();
    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    const found = vehicles.find(v => v.id === code);

    if (found) {
        loadVehicleIntoEditPanel(found);
    } else {
        document.getElementById('car-results-panel').style.display = 'none';
        notify.err('No se encontró ningún vehículo con ese código.');
    }
});

function loadVehicleIntoEditPanel(vehicle) {
    vehicleToEdit = vehicle;
    document.getElementById('edit-car-brand').value = vehicle.brand || '';
    document.getElementById('edit-car-model').value = vehicle.model || '';
    document.getElementById('edit-car-year').value = vehicle.year || '';
    document.getElementById('edit-car-price-pen').value = vehicle.priceSoles ?? vehicle.price ?? '';
    document.getElementById('edit-car-price-usd').value = vehicle.priceDollars ?? '';
    toggleCarFields(true);
    document.getElementById('car-results-panel').style.display = 'block';
    document.getElementById('car-results-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('btn-enable-car-edit').addEventListener('click', () => toggleCarFields(false));

document.getElementById('btn-save-car-edit').addEventListener('click', () => {
    let vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    const index = vehicles.findIndex(v => v.id === vehicleToEdit.id);
    if (index !== -1) {
        vehicles[index].brand = document.getElementById('edit-car-brand').value.trim();
        vehicles[index].model = document.getElementById('edit-car-model').value.trim();
        vehicles[index].year = parseInt(document.getElementById('edit-car-year').value);
        vehicles[index].priceSoles = parseMoney(document.getElementById('edit-car-price-pen').value);
        vehicles[index].priceDollars = parseMoney(document.getElementById('edit-car-price-usd').value);
        localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
        notify.ok('Datos del vehículo actualizados correctamente.');
        toggleCarFields(true);
        renderVehiclesHistory();
    }
});

function toggleCarFields(isLocked) {
    ['edit-car-brand', 'edit-car-model', 'edit-car-year', 'edit-car-price-pen', 'edit-car-price-usd']
        .forEach(id => document.getElementById(id).disabled = isLocked);
    document.getElementById('btn-enable-car-edit').style.display = isLocked ? 'block' : 'none';
    document.getElementById('btn-save-car-edit').style.display = isLocked ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', renderVehiclesHistory);

function renderVehiclesHistory() {
    const tbody = document.querySelector('#table-vehicles-history tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];

    if (vehicles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No hay vehículos en inventario actualmente.</td></tr>`;
        return;
    }

    vehicles.forEach(v => {
        const soles = v.priceSoles ?? v.price ?? 0;
        const dolares = v.priceDollars ?? 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--primary-blue);">${v.id}</td>
            <td>${v.brand || '-'}</td>
            <td>${v.model || '-'}</td>
            <td>${v.year || '-'}</td>
            <td>S/ ${formatMoney(soles)}</td>
            <td>$ ${formatMoney(dolares)}</td>
            <td><button class="btn-secondary" style="padding:6px 14px;">Editar</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => loadVehicleIntoEditPanel(v));
        tbody.appendChild(tr);
    });
}

['car-price-pen', 'car-price-usd', 'edit-car-price-pen', 'edit-car-price-usd']
    .forEach(id => attachMoneyFormat(document.getElementById(id)));

// Validación en vivo del formulario de registro
attachValidation(document.getElementById('car-year'), document.getElementById('err-car-year'), validators.year);
attachValidation(document.getElementById('car-price-pen'), document.getElementById('err-car-price-pen'), validators.positive);
attachValidation(document.getElementById('car-price-usd'), document.getElementById('err-car-price-usd'), validators.positive);
