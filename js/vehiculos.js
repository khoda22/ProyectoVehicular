const modal = document.getElementById('vehicle-modal');
const form = document.getElementById('vehicle-form');
const idInput = document.getElementById('car-id');
let editingId = null; // null = crear, id = editar

function openModal(vehicle) {
    editingId = vehicle ? vehicle.id : null;
    form.reset();
    document.getElementById('modal-title').textContent = vehicle ? 'Editar vehículo' : 'Nuevo vehículo';
    document.getElementById('modal-subtitle').textContent = vehicle
        ? 'Actualiza la información de la unidad'
        : 'Ingresa los datos de la unidad';

    // El código es la llave: no se puede cambiar al editar
    idInput.disabled = !!vehicle;

    if (vehicle) {
        idInput.value = vehicle.id;
        document.getElementById('car-brand').value = vehicle.brand || '';
        document.getElementById('car-model').value = vehicle.model || '';
        document.getElementById('car-year').value = vehicle.year || '';
        document.getElementById('car-price-pen').value = (vehicle.priceSoles ?? vehicle.price) ? formatMoney(vehicle.priceSoles ?? vehicle.price) : '';
        document.getElementById('car-price-usd').value = vehicle.priceDollars ? formatMoney(vehicle.priceDollars) : '';
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    (vehicle ? document.getElementById('car-brand') : idInput).focus();
}

function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    editingId = null;
}

document.getElementById('btn-new-vehicle').addEventListener('click', () => openModal(null));
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modal.addEventListener('mousedown', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    const id = idInput.value.trim().toUpperCase();

    const data = {
        id,
        brand: document.getElementById('car-brand').value.trim(),
        model: document.getElementById('car-model').value.trim(),
        year: parseInt(document.getElementById('car-year').value),
        priceSoles: parseMoney(document.getElementById('car-price-pen').value) || 0,
        priceDollars: parseMoney(document.getElementById('car-price-usd').value) || 0
    };

    if (editingId) {
        const i = vehicles.findIndex(v => v.id === editingId);
        if (i === -1) return;
        vehicles[i] = { ...vehicles[i], ...data };
        localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
        notify.ok('Vehículo actualizado correctamente.');
    } else {
        if (vehicles.find(v => v.id === id)) {
            notify.err('Este código de vehículo ya existe.');
            return;
        }
        vehicles.push(data);
        localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
        notify.ok('Vehículo añadido al inventario con éxito.');
    }

    closeModal();
    renderVehicles(document.getElementById('vehicle-search').value.trim().toLowerCase());
});

document.getElementById('vehicle-search').addEventListener('input', (e) => {
    renderVehicles(e.target.value.trim().toLowerCase());
});

function renderVehicles(query = '') {
    const tbody = document.querySelector('#table-vehicles-history tbody');
    if (!tbody) return;

    let vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    if (query) {
        vehicles = vehicles.filter(v =>
            (v.id || '').toLowerCase().includes(query) ||
            (v.brand || '').toLowerCase().includes(query) ||
            (v.model || '').toLowerCase().includes(query)
        );
    }
    tbody.innerHTML = '';

    if (vehicles.length === 0) {
        const msg = query ? 'No hay vehículos que coincidan con la búsqueda.' : 'No hay vehículos registrados. Crea el primero con “Nuevo vehículo”.';
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:26px;">${msg}</td></tr>`;
        return;
    }

    vehicles.forEach(v => {
        const soles = v.priceSoles ?? v.price ?? 0;
        const dolares = v.priceDollars ?? 0;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--primary);">${v.id}</td>
            <td>${v.brand || '-'}</td>
            <td>${v.model || '-'}</td>
            <td>${v.year || '-'}</td>
            <td>S/ ${formatMoney(soles)}</td>
            <td>$ ${formatMoney(dolares)}</td>
            <td><button class="btn-secondary btn-inline" data-id="${v.id}"><i class="hgi-stroke hgi-edit-02"></i> Editar</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => openModal(v));
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => renderVehicles());

attachMoneyFormat(document.getElementById('car-price-pen'));
attachMoneyFormat(document.getElementById('car-price-usd'));
attachValidation(document.getElementById('car-year'), document.getElementById('err-car-year'), validators.year);
attachValidation(document.getElementById('car-price-pen'), document.getElementById('err-car-price-pen'), validators.positive);
attachValidation(document.getElementById('car-price-usd'), document.getElementById('err-car-price-usd'), validators.positive);
