// --- REGISTRAR VEHÍCULO ---
document.getElementById('vehicle-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newVehicle = {
        id: document.getElementById('car-id').value.trim().toUpperCase(),
        brand: document.getElementById('car-brand').value.trim(),
        model: document.getElementById('car-model').value.trim(),
        year: parseInt(document.getElementById('car-year').value),
        priceSoles: parseFloat(document.getElementById('car-price-pen').value),
        priceDollars: parseFloat(document.getElementById('car-price-usd').value)
    };

    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    if (vehicles.find(v => v.id === newVehicle.id)) {
        alert('Este código de vehículo ya existe.');
        return;
    }

    vehicles.push(newVehicle);
    localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
    alert('Vehículo añadido al inventario con éxito.');
    document.getElementById('vehicle-form').reset();
    renderVehiclesHistory();
});

// --- BUSCAR VEHÍCULO ---
let vehicleToEdit = null;

document.getElementById('btn-search-car-panel').addEventListener('click', () => {
    const code = document.getElementById('search-car-code').value.trim().toUpperCase();
    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    vehicleToEdit = vehicles.find(v => v.id === code);
    const resultsPanel = document.getElementById('car-results-panel');

    if (vehicleToEdit) {
        document.getElementById('edit-car-brand').value = vehicleToEdit.brand || '';
        document.getElementById('edit-car-model').value = vehicleToEdit.model || '';
        document.getElementById('edit-car-year').value = vehicleToEdit.year || '';
        document.getElementById('edit-car-price-pen').value = vehicleToEdit.priceSoles ?? vehicleToEdit.price ?? '';
        document.getElementById('edit-car-price-usd').value = vehicleToEdit.priceDollars ?? '';
        toggleCarFields(true);
        resultsPanel.style.display = 'block';
    } else {
        resultsPanel.style.display = 'none';
        alert('No se encontró ningún vehículo con ese código.');
    }
});

document.getElementById('btn-enable-car-edit').addEventListener('click', () => toggleCarFields(false));

document.getElementById('btn-save-car-edit').addEventListener('click', () => {
    let vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    const index = vehicles.findIndex(v => v.id === vehicleToEdit.id);
    if (index !== -1) {
        vehicles[index].brand = document.getElementById('edit-car-brand').value.trim();
        vehicles[index].model = document.getElementById('edit-car-model').value.trim();
        vehicles[index].year = parseInt(document.getElementById('edit-car-year').value);
        vehicles[index].priceSoles = parseFloat(document.getElementById('edit-car-price-pen').value);
        vehicles[index].priceDollars = parseFloat(document.getElementById('edit-car-price-usd').value);
        localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
        alert('Datos del vehículo actualizados correctamente.');
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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No hay vehículos en inventario actualmente.</td></tr>`;
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
            <td>S/ ${Number(soles).toFixed(2)}</td>
            <td>$ ${Number(dolares).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}
