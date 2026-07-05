// --- REGISTRAR VEHÍCULO ---
document.getElementById('vehicle-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newVehicle = {
        id: document.getElementById('car-id').value.trim().toUpperCase(),
        model: document.getElementById('car-model').value.trim(),
        price: parseFloat(document.getElementById('car-price').value)
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
        document.getElementById('edit-car-model').value = vehicleToEdit.model;
        document.getElementById('edit-car-price').value = vehicleToEdit.price;
        toggleCarFields(true);
        resultsPanel.style.display = 'block';
    } else {
        resultsPanel.style.display = 'none';
        alert('No se encontró ningún vehículo con ese código.');
    }
});

document.getElementById('btn-enable-car-edit').addEventListener('click', () => {
    toggleCarFields(false);
});

document.getElementById('btn-save-car-edit').addEventListener('click', () => {
    let vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    const index = vehicles.findIndex(v => v.id === vehicleToEdit.id);

    if (index !== -1) {
        vehicles[index].model = document.getElementById('edit-car-model').value.trim();
        vehicles[index].price = parseFloat(document.getElementById('edit-car-price').value);

        localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
        alert('Datos del vehículo actualizados correctamente.');
        toggleCarFields(true);
        renderVehiclesHistory();
    }
});

function toggleCarFields(isLocked) {
    document.getElementById('edit-car-model').disabled = isLocked;
    document.getElementById('edit-car-price').disabled = isLocked;

    if (isLocked) {
        document.getElementById('btn-enable-car-edit').style.display = 'block';
        document.getElementById('btn-save-car-edit').style.display = 'none';
    } else {
        document.getElementById('btn-enable-car-edit').style.display = 'none';
        document.getElementById('btn-save-car-edit').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', renderVehiclesHistory);

function renderVehiclesHistory() {
    const tbody = document.querySelector('#table-vehicles-history tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    const currencySign = (localStorage.getItem('system_currency') || 'PEN') === 'PEN' ? 'S/' : '$';

    if (vehicles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No hay vehículos en inventario actualmente.</td></tr>`;
        return;
    }

    vehicles.forEach(v => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--primary-blue);">${v.id}</td>
            <td>${v.model}</td>
            <td>${currencySign} ${v.price.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}
