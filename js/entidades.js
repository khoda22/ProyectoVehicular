// --- REGISTRAR ENTIDAD FINANCIERA ---
document.getElementById('entity-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newEntity = {
        name: document.getElementById('ent-name').value.trim(),
        ruc: document.getElementById('ent-ruc').value.trim()
    };

    const entities = JSON.parse(localStorage.getItem('system_entities')) || [];
    if (entities.find(x => x.ruc === newEntity.ruc)) {
        alert('Ya existe una entidad con ese RUC.');
        return;
    }

    entities.push(newEntity);
    localStorage.setItem('system_entities', JSON.stringify(entities));
    alert('Entidad financiera registrada con éxito.');
    document.getElementById('entity-form').reset();
    renderEntities();
});

document.addEventListener('DOMContentLoaded', renderEntities);

function renderEntities() {
    const tbody = document.querySelector('#table-entities tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const entities = JSON.parse(localStorage.getItem('system_entities')) || [];

    if (entities.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">No hay entidades registradas.</td></tr>`;
        return;
    }

    entities.forEach(ent => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600;">${ent.name}</td>
            <td>${ent.ruc}</td>
            <td><button class="btn-secondary" style="padding:6px 14px;" onclick="deleteEntity('${ent.ruc}')">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteEntity(ruc) {
    if (!confirm('¿Eliminar esta entidad?')) return;
    let entities = JSON.parse(localStorage.getItem('system_entities')) || [];
    entities = entities.filter(x => x.ruc !== ruc);
    localStorage.setItem('system_entities', JSON.stringify(entities));
    renderEntities();
}
