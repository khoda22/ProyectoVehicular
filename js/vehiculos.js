document.getElementById('vehicle-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newVehicle = {
        id: document.getElementById('car-id').value.toUpperCase(),
        model: document.getElementById('car-model').value,
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
});

// --- ACCIÓN 1: REGISTRAR VEHÍCULO ---
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
});

// --- ACCIÓN 2: BUSCAR VEHÍCULO ---
let vehicleToEdit = null; // Almacenamiento temporal del auto encontrado

document.getElementById('btn-search-car-panel').addEventListener('click', () => {
    const code = document.getElementById('search-car-code').value.trim().toUpperCase();
    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    
    vehicleToEdit = vehicles.find(v => v.id === code);
    const resultsPanel = document.getElementById('car-results-panel');

    if (vehicleToEdit) {
        // Rellenar los campos con la información actual
        document.getElementById('edit-car-model').value = vehicleToEdit.model;
        document.getElementById('edit-car-price').value = vehicleToEdit.price;
        
        // Mantener inputs bloqueados por seguridad al inicio y mostrar sección
        toggleCarFields(true);
        resultsPanel.style.display = 'block';
    } else {
        resultsPanel.style.display = 'none';
        alert('No se encontró ningún vehículo con ese código.');
    }
});

// --- ACCIÓN 3: HABILITAR EDICIÓN ---
document.getElementById('btn-enable-car-edit').addEventListener('click', () => {
    toggleCarFields(false); // Desbloquea controles
});

// --- ACCIÓN 4: GUARDAR CAMBIOS ---
document.getElementById('btn-save-car-edit').addEventListener('click', () => {
    let vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    
    // Buscar el índice del auto en la lista original
    const index = vehicles.findIndex(v => v.id === vehicleToEdit.id);
    
    if (index !== -1) {
        // Reemplazar con los nuevos valores ingresados
        vehicles[index].model = document.getElementById('edit-car-model').value.trim();
        vehicles[index].price = parseFloat(document.getElementById('edit-car-price').value);
        
        // Actualizar LocalStorage
        localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
        
        alert('Datos del vehículo actualizados correctamente.');
        toggleCarFields(true); // Bloquear de nuevo
    }
});

// Función auxiliar para controlar el estado de bloqueo de las cajas de texto
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

// --- NUEVA ACCIÓN: MOSTRAR HISTORIAL DE VEHÍCULOS ---
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

// Al igual que en clientes, agrega la línea:
// renderVehiclesHistory();
// justo después de actualizar el LocalStorage en la función de REGISTRAR y de GUARDAR CAMBIOS de vehículos.