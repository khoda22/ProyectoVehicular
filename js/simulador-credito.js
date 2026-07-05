// Estado de trabajo de la simulación activa
let activeClient = null;
let activeVehicle = null;
let baseSchedule = [];       // cronograma sin gracia adicional
let workingSchedule = [];    // cronograma vigente (con gracia si aplica)
let currentParams = null;    // parámetros de la simulación en curso

// Control de pestañas
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    if (tabId === 'tab-historial') renderFullHistory();
}

// Somos la entidad: sus parámetros vienen de Configuración (system_entity)
const ENTITY_DEFAULTS = { nombre: 'Financiera Compra Inteligente', ruc: '20512345678', tipoTasa: 'TE', capitalizacion: 30, teaReferencial: 12.5, segDesgravamen: 0.0714, segVehicular: 0.32 };
const ENTITY = { ...ENTITY_DEFAULTS, ...(JSON.parse(localStorage.getItem('system_entity')) || {}) };

// Buscadores typeahead (escribe y filtra; no listas completas)
let activeBank = ENTITY.nombre;

// Escapa texto de datos del usuario antes de meterlo en HTML
function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

// --- CLIENTE: tarjeta con vista de solo lectura y edición inline (sin salir del simulador) ---
function clientCardView(c) {
    return `
    <div class="entity-card">
        <div class="entity-card-head">
            <strong>${esc(c.name)}</strong>
            <button type="button" class="entity-edit" onclick="startEditClient()"><i class="hgi-stroke hgi-edit-02"></i> Editar</button>
        </div>
        <div class="entity-card-body">
            <div><span>DNI / CE</span>${esc(c.id)}</div>
            <div><span>Correo</span>${esc(c.email || '—')}</div>
            <div><span>Teléfono</span>${esc(c.phone || '—')}</div>
            <div><span>Ingreso mensual</span>S/ ${formatMoney(c.income)}</div>
        </div>
    </div>`;
}
function clientCardEdit(c) {
    return `
    <div class="entity-card">
        <div class="entity-card-head"><strong>Editar cliente · DNI ${esc(c.id)}</strong></div>
        <div class="entity-edit-form">
            <div class="input-group"><label>Nombre</label><input type="text" id="ec-name" value="${esc(c.name)}"></div>
            <div class="input-group"><label>Correo</label><input type="text" id="ec-email" value="${esc(c.email || '')}"></div>
            <div class="input-group"><label>Teléfono</label><input type="text" id="ec-phone" value="${esc(c.phone || '')}"></div>
            <div class="input-group"><label>Ingreso mensual (S/)</label><input type="text" id="ec-income" value="${esc(c.income)}"></div>
        </div>
        <div class="entity-form-actions">
            <button type="button" class="btn-secondary btn-inline" onclick="cancelEditClient()">Cancelar</button>
            <button type="button" class="btn-login btn-inline" onclick="saveClientInline()">Guardar</button>
        </div>
    </div>`;
}
function renderClientInfo(editing) {
    const el = document.getElementById('sim-client-info');
    if (!el) return;
    el.innerHTML = !activeClient ? '' : (editing ? clientCardEdit(activeClient) : clientCardView(activeClient));
}
function startEditClient() { renderClientInfo(true); }
function cancelEditClient() { renderClientInfo(false); }
function saveClientInline() {
    const name = document.getElementById('ec-name').value.trim();
    const income = parseMoney(document.getElementById('ec-income').value) || 0;
    if (!name) { notify.err('El nombre no puede estar vacío.'); return; }
    if (income <= 0) { notify.err('Ingresa un ingreso mensual válido.'); return; }
    const clients = JSON.parse(localStorage.getItem('system_clients')) || [];
    const idx = clients.findIndex(x => x.id === activeClient.id);
    if (idx === -1) { notify.err('No se encontró el cliente en el sistema.'); return; }
    clients[idx] = {
        ...clients[idx], name, income,
        email: document.getElementById('ec-email').value.trim(),
        phone: document.getElementById('ec-phone').value.trim()
    };
    localStorage.setItem('system_clients', JSON.stringify(clients));
    activeClient = clients[idx];
    renderClientInfo(false);
    updateLiveSummary();
    notify.ok('Datos del cliente actualizados.');
}

// --- VEHÍCULO: misma lógica de vista/edición inline ---
function vehicleCardView(v) {
    const pen = v.priceSoles ?? v.price ?? 0;
    const usd = v.priceDollars ?? 0;
    return `
    <div class="entity-card">
        <div class="entity-card-head">
            <strong>${esc(v.brand || '')} ${esc(v.model || '')}</strong>
            <button type="button" class="entity-edit" onclick="startEditVehicle()"><i class="hgi-stroke hgi-edit-02"></i> Editar</button>
        </div>
        <div class="entity-card-body">
            <div><span>Código</span>${esc(v.id)}</div>
            <div><span>Año</span>${esc(v.year || '—')}</div>
            <div><span>Precio S/</span>S/ ${formatMoney(pen)}</div>
            <div><span>Precio US$</span>$ ${formatMoney(usd)}</div>
        </div>
    </div>`;
}
function vehicleCardEdit(v) {
    return `
    <div class="entity-card">
        <div class="entity-card-head"><strong>Editar vehículo · ${esc(v.id)}</strong></div>
        <div class="entity-edit-form">
            <div class="input-group"><label>Marca</label><input type="text" id="ev-brand" value="${esc(v.brand || '')}"></div>
            <div class="input-group"><label>Modelo</label><input type="text" id="ev-model" value="${esc(v.model || '')}"></div>
            <div class="input-group"><label>Año</label><input type="text" id="ev-year" value="${esc(v.year || '')}"></div>
            <div class="input-group"><label>Precio S/</label><input type="text" id="ev-pen" value="${esc(v.priceSoles ?? v.price ?? '')}"></div>
            <div class="input-group"><label>Precio US$</label><input type="text" id="ev-usd" value="${esc(v.priceDollars ?? '')}"></div>
        </div>
        <div class="entity-form-actions">
            <button type="button" class="btn-secondary btn-inline" onclick="cancelEditVehicle()">Cancelar</button>
            <button type="button" class="btn-login btn-inline" onclick="saveVehicleInline()">Guardar</button>
        </div>
    </div>`;
}
function renderVehicleInfo(editing) {
    const el = document.getElementById('sim-car-info');
    if (!el) return;
    el.innerHTML = !activeVehicle ? '' : (editing ? vehicleCardEdit(activeVehicle) : vehicleCardView(activeVehicle));
}
function startEditVehicle() { renderVehicleInfo(true); }
function cancelEditVehicle() { renderVehicleInfo(false); }
function saveVehicleInline() {
    const brand = document.getElementById('ev-brand').value.trim();
    const model = document.getElementById('ev-model').value.trim();
    const priceSoles = parseMoney(document.getElementById('ev-pen').value) || 0;
    if (!brand || !model) { notify.err('Marca y modelo son obligatorios.'); return; }
    if (priceSoles <= 0) { notify.err('Ingresa un precio en soles válido.'); return; }
    const vehicles = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    const idx = vehicles.findIndex(x => x.id === activeVehicle.id);
    if (idx === -1) { notify.err('No se encontró el vehículo en el sistema.'); return; }
    vehicles[idx] = {
        ...vehicles[idx], brand, model, priceSoles,
        year: parseInt(document.getElementById('ev-year').value) || vehicles[idx].year,
        priceDollars: parseMoney(document.getElementById('ev-usd').value) || 0
    };
    localStorage.setItem('system_vehicles', JSON.stringify(vehicles));
    activeVehicle = vehicles[idx];
    renderVehicleInfo(false);
    updateLiveSummary();
    notify.ok('Datos del vehículo actualizados.');
}

createTypeahead({
    inputId: 'sim-client-id',
    getList: () => JSON.parse(localStorage.getItem('system_clients')) || [],
    match: (c, q) => c.id.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q),
    label: c => `${c.name} — DNI ${c.id}`,
    emptyText: 'No hay clientes registrados.',
    onSelect: (c) => {
        activeClient = c;
        renderClientInfo(false);
        validateFormHability();
    }
});

createTypeahead({
    inputId: 'sim-car-id',
    getList: () => JSON.parse(localStorage.getItem('system_vehicles')) || [],
    match: (v, q) => (v.id || '').toLowerCase().includes(q) || (v.model || '').toLowerCase().includes(q) || (v.brand || '').toLowerCase().includes(q),
    label: v => `${v.brand || ''} ${v.model} — ${v.id}`,
    emptyText: 'No hay vehículos registrados.',
    onSelect: (v) => {
        activeVehicle = v;
        renderVehicleInfo(false);
        validateFormHability();
        updateLiveSummary();
    }
});

// (La entidad ya no se elige por operación: somos nosotros, definida en Configuración)

// Vuelca los parámetros de la entidad (config) a los campos de solo lectura del simulador
function applyEntityConfig() {
    document.getElementById('sim-rate-type').value = ENTITY.tipoTasa;
    document.getElementById('sim-capitalization').value = ENTITY.capitalizacion;
    document.getElementById('sim-rate-val').value = ENTITY.teaReferencial;
    document.getElementById('sim-seg-desgravamen').value = ENTITY.segDesgravamen;
    document.getElementById('sim-seg-vehicular').value = ENTITY.segVehicular;
    const dispDesg = document.getElementById('disp-seg-desg');
    const dispVeh = document.getElementById('disp-seg-veh');
    if (dispDesg) dispDesg.textContent = ENTITY.segDesgravamen;
    if (dispVeh) dispVeh.textContent = ENTITY.segVehicular;
    const tcEl = document.getElementById('sim-tc');
    if (tcEl) tcEl.value = localStorage.getItem('system_tc') || '3.75';
    toggleCapGroup();
    updateRateHint();
}

// La capitalización solo aplica (y se muestra) cuando la tasa es nominal
function toggleCapGroup() {
    const capGroup = document.getElementById('cap-group');
    if (capGroup) capGroup.style.display = document.getElementById('sim-rate-type').value === 'TN' ? '' : 'none';
}

// Adapta la etiqueta (TEA/TNA) y muestra la TEA equivalente cuando la tasa es nominal
const CAP_LABELS = { 1: 'diaria', 30: 'mensual', 90: 'trimestral', 180: 'semestral', 360: 'anual' };
function updateRateHint() {
    const type = document.getElementById('sim-rate-type').value;
    const lbl = document.getElementById('rate-type-label');
    const note = document.getElementById('rate-note');
    if (lbl) lbl.textContent = type === 'TE' ? 'TEA' : 'TNA';
    if (!note) return;
    if (type === 'TE') {
        note.textContent = 'Tasa efectiva anual (TEA): ya incluye la capitalización, se usa directamente.';
        return;
    }
    const capDays = parseInt(document.getElementById('sim-capitalization').value);
    const m = 360 / capDays;
    const capTxt = CAP_LABELS[capDays] || (capDays + ' días');
    const rateVal = parseFloat(document.getElementById('sim-rate-val').value) / 100;
    if (rateVal > 0) {
        const tea = (Math.pow(1 + rateVal / m, m) - 1) * 100;
        note.textContent = `Tasa nominal anual (TNA), capitalización ${capTxt} → equivale a TEA ${tea.toFixed(2)} %.`;
    } else {
        note.textContent = `Tasa nominal anual (TNA), capitalización ${capTxt}. Se convertirá a TEA al calcular.`;
    }
}
applyEntityConfig();
document.getElementById('sim-rate-val').addEventListener('input', updateRateHint);
document.getElementById('sim-rate-type').addEventListener('change', () => { toggleCapGroup(); updateRateHint(); updateLiveSummary(); });
document.getElementById('sim-capitalization').addEventListener('change', () => { updateRateHint(); updateLiveSummary(); });

// Sliders con valor en vivo y relleno de color
const SLIDERS = [
    ['sim-downpayment', 'val-downpayment', ' %'],
    ['sim-balloon', 'val-balloon', ' %'],
    ['sim-months', 'val-months', ' meses']
];
function paintSlider(id, outId, unit) {
    const el = document.getElementById(id);
    if (!el) return;
    const min = Number(el.min) || 0;
    const max = Number(el.max) || 100;
    const pct = max === min ? 0 : ((Number(el.value) - min) / (max - min)) * 100;
    el.style.setProperty('--_p', pct + '%');
    const out = document.getElementById(outId);
    if (out) out.textContent = el.value + unit;
}
function paintAllSliders() { SLIDERS.forEach(s => paintSlider(...s)); }
SLIDERS.forEach(([id, outId, unit]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => paintSlider(id, outId, unit));
});
paintAllSliders();

// Toggle de moneda (segmented control) → escribe en el hidden #sim-currency
document.querySelectorAll('#currency-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('#currency-toggle button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('sim-currency').value = btn.dataset.value;
        updateLiveSummary();
    });
});

// Switch de bono/descuento: el input solo aparece si se activa
const bonoToggle = document.getElementById('sim-bono-toggle');
const bonoInput = document.getElementById('sim-bono');
if (bonoToggle && bonoInput) {
    bonoToggle.addEventListener('change', () => {
        bonoInput.style.display = bonoToggle.checked ? '' : 'none';
        if (bonoToggle.checked) bonoInput.focus();
        else bonoInput.value = '0';
        updateLiveSummary();
    });
}

// El tipo de tasa y la capitalización se definen en Configuración (system_entity), no por operación.

function validateFormHability() {
    document.getElementById('btn-calc-simulation').disabled = !(activeClient && activeVehicle);
}

// MOTOR PRINCIPAL
document.getElementById('simulation-engine-form').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateFinancialPlan();
});

function calculateFinancialPlan() {
    const currency = document.getElementById('sim-currency').value;
    const downPct = parseFloat(document.getElementById('sim-downpayment').value) / 100;
    const balloonPct = parseFloat(document.getElementById('sim-balloon').value) / 100;
    const bono = parseMoney(document.getElementById('sim-bono').value) || 0;
    const periodDays = parseInt(document.getElementById('sim-period').value);
    const months = parseInt(document.getElementById('sim-months').value);
    const rateType = document.getElementById('sim-rate-type').value;
    const rateVal = parseFloat(document.getElementById('sim-rate-val').value) / 100;
    const capDays = parseInt(document.getElementById('sim-capitalization').value);
    const segDesgPct = (parseFloat(document.getElementById('sim-seg-desgravamen').value) || 0) / 100;
    const segVehPct = (parseFloat(document.getElementById('sim-seg-vehicular').value) || 0) / 100;

    const precio = currency === 'PEN'
        ? (activeVehicle.priceSoles ?? activeVehicle.price)
        : (activeVehicle.priceDollars ?? activeVehicle.price);

    if (!precio || precio <= 0) {
        notify.err('El vehículo no tiene precio válido en la moneda seleccionada.');
        return;
    }
    if (!rateVal || rateVal <= 0) {
        notify.err('Ingrese un valor de tasa válido.');
        return;
    }

    const cuotaInicial = precio * downPct;
    const balloon = precio * balloonPct;
    const montoFinanciar = precio - cuotaInicial - bono;

    if (montoFinanciar <= 0) {
        notify.err('El monto a financiar debe ser mayor a cero. Revise cuota inicial y bono.');
        return;
    }
    if (balloon >= montoFinanciar) {
        notify.err('La cuota final (balloon) no puede ser mayor o igual al monto a financiar.');
        return;
    }

    // TEA de referencia (efectiva directa, o nominal convertida vía capitalización)
    let TEA;
    if (rateType === 'TE') {
        TEA = rateVal;
    } else {
        const m = 360 / capDays;
        TEA = Math.pow(1 + rateVal / m, m) - 1;
    }
    const i = Math.pow(1 + TEA, periodDays / 360) - 1;
    const n = Math.round(months * 30 / periodDays);

    // Cuota nivelada: se calcula a la tasa combinada (interés + desgravamen) para que la cuota
    // total sea CONSTANTE; la amortización absorbe la variación del seguro (modelo BBVA/Excel).
    const er = i + segDesgPct;
    const pvBalloon = balloon / Math.pow(1 + er, n);
    const base = montoFinanciar - pvBalloon;
    const cuotaFija = er === 0 ? base / n : base * (er * Math.pow(1 + er, n)) / (Math.pow(1 + er, n) - 1);

    const tc = parseFloat(document.getElementById('sim-tc').value) || null;
    currentParams = { currency, precio, montoFinanciar, balloon, i, n, TEA, periodDays, segDesgPct, segVehPct, cuotaFija, tc };

    baseSchedule = buildSchedule(montoFinanciar, i, cuotaFija, n, balloon, precio, segDesgPct, segVehPct);
    workingSchedule = baseSchedule.map(r => ({ ...r }));

    processIndicators();
    renderScheduleTable(workingSchedule);
    renderResultHero();
    if (window.simShowResult) window.simShowResult();
    else document.getElementById('simulation-report-section').style.display = 'block';
}

// Rellena la hoja resumen (cifras principales) del resultado
function renderResultHero() {
    const p = currentParams;
    const sign = p.currency === 'PEN' ? 'S/' : '$';
    document.getElementById('res-financiado').textContent = `${sign} ${formatMoney(p.montoFinanciar)}`;
    document.getElementById('res-cuota').textContent = `${sign} ${formatMoney(workingSchedule[0].cuotaTotal)}`;
    document.getElementById('res-plazo').textContent = `${p.n} cuotas`;
    document.getElementById('res-tea').textContent = `${(p.TEA * 100).toFixed(2)} %`;
    document.getElementById('res-tcea').textContent = document.getElementById('sbs-tcea').textContent;
}

// Construye el cronograma; la cuota balloon se paga como residual en el último periodo
function buildSchedule(monto, i, cuota, n, balloon, precio, dDesg, dVeh) {
    const rows = [];
    let saldo = monto;

    for (let k = 1; k <= n; k++) {
        const interes = saldo * i;
        const segDesg = saldo * dDesg;
        // La amortización es el residuo de la cuota nivelada tras interés y desgravamen
        let amort = cuota - interes - segDesg;
        let bal = 0;
        let saldoFinal = saldo - amort;

        if (k === n) {
            bal = saldoFinal;      // saldo remanente = cuota balloon; absorbe el redondeo
            saldoFinal = 0;
        }

        const segVeh = precio * dVeh;
        const cuotaFin = interes + amort + bal;               // capital + interés (valida VAN≈0 a tasa i)
        const cuotaTotal = cuotaFin + segDesg + segVeh;       // = cuota nivelada + seg. vehicular (constante)

        rows.push({ num: k, saldoInicial: saldo, interes, amortizacion: amort, balloon: bal, segDesg, segVeh, cuota: cuotaFin, cuotaTotal, saldoFinal });
        saldo = saldoFinal;
    }
    return rows;
}

function processIndicators() {
    const p = currentParams;

    // Flujo financiero (solo cuota) → valida el modelo: VAN ≈ 0 a la tasa del crédito
    const flujoFin = [p.montoFinanciar];
    workingSchedule.forEach(r => flujoFin.push(-r.cuota));
    const van = calcularVAN(flujoFin, p.i);
    const tirPeriodo = calcularTIR(flujoFin);

    // Flujo total (con seguros) → TCEA de transparencia (SBS)
    const flujoTotal = [p.montoFinanciar];
    workingSchedule.forEach(r => flujoTotal.push(-r.cuotaTotal));
    const tirTotal = calcularTIR(flujoTotal);
    const tcea = Math.pow(1 + tirTotal, 360 / p.periodDays) - 1;

    const sign = p.currency === 'PEN' ? 'S/' : '$';
    document.getElementById('sbs-tcea').innerText = `${(tcea * 100).toFixed(2)} %`;
    document.getElementById('sbs-van').innerText = `${sign} ${formatMoney(van)}`;
    document.getElementById('sbs-tir').innerText = `${(tirPeriodo * 100).toFixed(4)} % (per.)`;

    // Semáforo de riesgo: ingreso mensual frente a la primera cuota total
    const primeraCuota = workingSchedule[0].cuotaTotal;
    const ratio = (activeClient.income / primeraCuota) * 100;

    const container = document.getElementById('risk-semaphore-container');
    const badge = document.getElementById('risk-client-badge');
    const ratioText = document.getElementById('risk-client-ratio');
    ratioText.innerText = `El ingreso mensual del cliente representa el ${ratio.toFixed(2)}% de la primera cuota total.`;

    if (ratio <= 50) {
        container.style.backgroundColor = '#fee2e2';
        container.style.color = '#991b1b';
        badge.innerText = 'SOLICITANTE: NO FACTIBLE (ROJO)';
    } else if (ratio <= 70) {
        container.style.backgroundColor = '#fef3c7';
        container.style.color = '#92400e';
        badge.innerText = 'SOLICITANTE: RIESGO MODERADO (AMARILLO)';
    } else {
        container.style.backgroundColor = '#dcfce7';
        container.style.color = '#166534';
        badge.innerText = 'SOLICITANTE: FACTIBLE / APTO (VERDE)';
    }
}

function renderScheduleTable(data) {
    const p = currentParams;
    const sign = p.currency === 'PEN' ? 'S/' : '$';
    const tbody = document.querySelector('#table-cronograma tbody');
    tbody.innerHTML = '';

    data.forEach(row => {
        const amortLabel = row.balloon > 0.01 && row.num === p.n
            ? `${formatMoney(row.amortizacion)} + ${formatMoney(row.balloon)} (balloon)`
            : formatMoney(row.amortizacion);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.num}</td>
            <td>${sign} ${formatMoney(row.saldoInicial)}</td>
            <td>${sign} ${formatMoney(row.interes)}</td>
            <td>${sign} ${amortLabel}</td>
            <td>${sign} ${formatMoney(row.segDesg)}</td>
            <td>${sign} ${formatMoney(row.segVeh)}</td>
            <td style="font-weight:600; color:var(--primary-dark);">${sign} ${formatMoney(row.cuotaTotal)}</td>
            <td>${sign} ${formatMoney(row.saldoFinal)}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalPagado = data.reduce((acc, r) => acc + r.cuotaTotal, 0);
    const tcRef = localStorage.getItem('system_tc');
    const tcTxt = (p.currency === 'USD' && tcRef) ? ` | T.C. ref: S/ ${Number(tcRef).toFixed(2)}` : '';
    document.getElementById('report-summary-text').innerText =
        `Moneda: ${p.currency === 'PEN' ? 'Soles' : 'Dólares'} | TEA: ${(p.TEA * 100).toFixed(2)}% | Monto financiado: ${sign} ${formatMoney(p.montoFinanciar)} | Cuota balloon: ${sign} ${formatMoney(p.balloon)} | Total pagado: ${sign} ${formatMoney(totalPagado)}${tcTxt}`;
}

// GRACIA (total o parcial) sobre las cuotas indicadas — reconstruye el cronograma en cascada
document.getElementById('btn-apply-gracia').addEventListener('click', () => {
    if (!currentParams) return;
    const type = document.getElementById('gracia-type').value;
    const targetInput = document.getElementById('gracia-target').value;

    if (type === 'NINGUNO') {
        workingSchedule = baseSchedule.map(r => ({ ...r }));
        processIndicators();
        renderScheduleTable(workingSchedule);
        notify.info('Periodos de gracia restablecidos.');
        return;
    }

    const targetCuotas = targetInput.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    if (targetCuotas.length === 0) {
        notify.err('Escriba al menos un número de cuota válido.');
        return;
    }

    const p = currentParams;
    const rows = [];
    let saldo = p.montoFinanciar;

    for (let k = 1; k <= p.n; k++) {
        const interes = saldo * p.i;
        const segDesg = saldo * p.segDesgPct;
        let amort, bal = 0, cuotaFin, saldoFinal;

        if (targetCuotas.includes(k) && type === 'TOTAL') {
            amort = 0;
            cuotaFin = 0;
            saldoFinal = saldo + interes;   // el interés se capitaliza al saldo
        } else if (targetCuotas.includes(k) && type === 'PARCIAL') {
            amort = 0;
            cuotaFin = interes;             // paga solo interés
            saldoFinal = saldo;
        } else {
            amort = p.cuotaFija - interes - segDesg;   // la amortización absorbe el desgravamen
            saldoFinal = saldo - amort;
            cuotaFin = interes + amort;
        }

        if (k === p.n) {
            bal = saldoFinal;               // el saldo remanente se cancela como cuota balloon
            saldoFinal = 0;
            cuotaFin = interes + amort + bal;
        }

        const segVeh = p.precio * p.segVehPct;
        rows.push({ num: k, saldoInicial: saldo, interes, amortizacion: amort, balloon: bal, segDesg, segVeh, cuota: cuotaFin, cuotaTotal: cuotaFin + segDesg + segVeh, saldoFinal });
        saldo = saldoFinal;
    }

    workingSchedule = rows;
    processIndicators();
    renderScheduleTable(workingSchedule);
    renderResultHero();
    notify.ok('Cronograma recalculado con el periodo de gracia aplicado.');
});

// GUARDAR SIMULACIÓN
document.getElementById('btn-save-final').addEventListener('click', () => {
    if (!currentParams) return;
    const history = JSON.parse(localStorage.getItem('system_simulations')) || [];

    const sim = {
        id: 'SIM-' + (history.length + 1).toString().padStart(4, '0'),
        clientDni: activeClient.id,
        clientName: activeClient.name,
        carModel: activeVehicle.model,
        bank: activeBank || ENTITY.nombre,
        currency: currentParams.currency,
        tea: currentParams.TEA,
        montoFinanciar: currentParams.montoFinanciar,
        balloon: currentParams.balloon,
        schedule: workingSchedule
    };

    history.push(sim);
    localStorage.setItem('system_simulations', JSON.stringify(history));
    notify.ok(`Simulación ${sim.id} guardada exitosamente en el historial del cliente.`);
    resetSimulationWorkspace();
});

// GENERAR PDF — hoja resumen estilo entidad financiera (transparencia SBS)
document.getElementById('btn-download-pdf').addEventListener('click', () => {
    if (!currentParams || !workingSchedule.length) {
        notify.err('Genere primero una simulación.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const p = currentParams;
    const sign = p.currency === 'PEN' ? 'S/' : '$';
    const totalPagado = workingSchedule.reduce((a, r) => a + r.cuotaTotal, 0);
    const crimson = [192, 32, 60];

    let y = 44;
    doc.setFontSize(17); doc.setFont(undefined, 'bold'); doc.setTextColor(23, 23, 28);
    doc.text('Cotización de Crédito Vehicular', 40, y);
    doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(120);
    doc.text(activeBank || ENTITY.nombre, 40, y + 16);
    doc.setTextColor(150);
    doc.text('Compra Inteligente', 555, y + 16, { align: 'right' });

    y += 46;
    doc.setTextColor(120); doc.setFontSize(10);
    doc.text('Importe financiado', 40, y);
    doc.setTextColor(192, 32, 60); doc.setFontSize(24); doc.setFont(undefined, 'bold');
    doc.text(`${sign} ${formatMoney(p.montoFinanciar)}`, 40, y + 26);

    const resumen = [
        ['Cliente', `${activeClient.name} (DNI ${activeClient.id})`],
        ['Vehículo', `${activeVehicle.brand || ''} ${activeVehicle.model}`],
        ['Moneda', p.currency === 'PEN' ? 'Soles' : 'Dólares'],
        ...(p.currency === 'USD' && p.tc ? [['Tipo de cambio', `S/ ${p.tc.toFixed(2)} por US$`]] : []),
        ['Cuota mensual', `${sign} ${formatMoney(workingSchedule[0].cuotaTotal)}`],
        ['Plazo', `${p.n} cuotas`],
        ['Tasa Efectiva Anual (TEA)', `${(p.TEA * 100).toFixed(2)} %`],
        ['TCEA Referencial', document.getElementById('sbs-tcea').innerText],
        ['Cuota final (balloon)', `${sign} ${formatMoney(p.balloon)}`],
        ['Total a pagar', `${sign} ${formatMoney(totalPagado)}`]
    ];
    doc.autoTable({
        startY: y + 44,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { textColor: 120 }, 1: { halign: 'right', fontStyle: 'bold', textColor: 40 } },
        body: resumen
    });

    doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(23, 23, 28);
    doc.text('Cronograma de pagos', 40, doc.lastAutoTable.finalY + 22);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 30,
        head: [['Nro', 'Saldo Inicial', 'Interés', 'Amortiz.', 'Desgrav.', 'Seg. Veh.', 'Cuota Total', 'Saldo Final']],
        body: workingSchedule.map(r => [
            r.num,
            formatMoney(r.saldoInicial),
            formatMoney(r.interes),
            formatMoney(r.amortizacion),
            formatMoney(r.segDesg),
            formatMoney(r.segVeh),
            formatMoney(r.cuotaTotal),
            formatMoney(r.saldoFinal)
        ]),
        theme: 'striped',
        headStyles: { fillColor: crimson, fontSize: 7.5 },
        styles: { fontSize: 7, cellPadding: 2, halign: 'right' },
        columnStyles: { 0: { halign: 'center' } }
    });

    let ny = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(23, 23, 28);
    doc.text('IMPORTANTE', 40, ny);
    doc.setFont(undefined, 'normal'); doc.setFontSize(8); doc.setTextColor(120);
    [
        'Los datos emitidos por este simulador son referenciales.',
        'El otorgamiento del préstamo está sujeto a evaluación crediticia.',
        'La simulación no incluye el ITF. La tasa de interés es fija.',
        'La TCEA incluye intereses y seguros según la norma de transparencia de la SBS.'
    ].forEach((t, i) => doc.text('•  ' + t, 40, ny + 14 + i * 12));

    doc.save(`cotizacion-${activeClient.id}.pdf`);
    notify.ok('PDF generado.');
});

function resetSimulationWorkspace() {
    document.getElementById('simulation-engine-form').reset();
    document.getElementById('simulation-report-section').style.display = 'none';
    document.getElementById('sim-client-info').innerHTML = '';
    document.getElementById('sim-car-info').innerHTML = '';
    applyEntityConfig();   // form.reset vació los hidden/readonly de la entidad; se repueblan
    paintAllSliders();
    // Restablecer toggles de UI (form.reset no toca clases ni display)
    document.querySelectorAll('#currency-toggle button').forEach(b => b.classList.toggle('active', b.dataset.value === 'PEN'));
    document.getElementById('sim-currency').value = 'PEN';
    if (bonoToggle && bonoInput) { bonoToggle.checked = false; bonoInput.style.display = 'none'; }
    activeClient = null;
    activeVehicle = null;
    activeBank = ENTITY.nombre;
    currentParams = null;
    validateFormHability();
    if (window.simResetWizard) window.simResetWizard();
}

// HISTORIAL
function renderFullHistory() {
    const container = document.getElementById('history-list-container');
    const history = JSON.parse(localStorage.getItem('system_simulations')) || [];
    if (history.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No hay simulaciones registradas en el sistema.</p>';
        return;
    }
    buildHistoryCards(history, container);
}

function deleteSimulation(id) {
    if (!confirm('¿Eliminar esta simulación? Esta acción no se puede deshacer.')) return;
    let history = JSON.parse(localStorage.getItem('system_simulations')) || [];
    history = history.filter(s => s.id !== id);
    localStorage.setItem('system_simulations', JSON.stringify(history));
    renderFullHistory();
}

document.getElementById('btn-filter-history').addEventListener('click', () => {
    const dni = document.getElementById('search-history-dni').value.trim();
    const container = document.getElementById('history-list-container');
    const history = JSON.parse(localStorage.getItem('system_simulations')) || [];
    const filtered = history.filter(s => s.clientDni === dni);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:var(--primary); text-align:center;">No se encontraron simulaciones para el DNI ingresado.</p>';
        return;
    }
    buildHistoryCards(filtered, container);
});

function buildHistoryCards(list, container) {
    container.innerHTML = '';
    list.forEach(sim => {
        const sign = sim.currency === 'PEN' ? 'S/' : '$';
        const totalPagado = sim.schedule.reduce((a, r) => a + (r.cuotaTotal ?? r.cuota), 0);

        const card = document.createElement('div');
        card.className = 'history-item-card';

        let rowsHtml = '';
        sim.schedule.forEach(r => {
            rowsHtml += `
                <tr>
                    <td>${r.num}</td>
                    <td>${sign} ${formatMoney(r.saldoInicial)}</td>
                    <td>${sign} ${formatMoney(r.interes)}</td>
                    <td>${sign} ${formatMoney(r.amortizacion)}</td>
                    <td>${sign} ${formatMoney(r.cuotaTotal ?? r.cuota)}</td>
                    <td>${sign} ${formatMoney(r.saldoFinal)}</td>
                </tr>`;
        });

        card.innerHTML = `
            <div class="history-header" style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <div class="history-toggle" style="display:flex; align-items:center; gap:12px; cursor:pointer; flex:1;">
                    <span class="history-caret" style="color:var(--primary); font-size:12px;">▶</span>
                    <div>
                        <h4 style="color:var(--primary-dark); font-size:15px;">${sim.id} · ${sim.clientName}</h4>
                        <p style="font-size:12.5px; color:var(--text-muted);">${sim.carModel} | ${sim.bank} | Total: ${sign} ${formatMoney(totalPagado)}</p>
                    </div>
                </div>
                <button class="btn-secondary" style="padding:8px 16px;" onclick="deleteSimulation('${sim.id}')">Eliminar</button>
            </div>
            <div class="history-detail" style="display:none; margin-top:16px;">
                <div class="table-wrapper">
                    <table class="banking-table text-small">
                        <thead>
                            <tr><th>Nro</th><th>Saldo Inicial</th><th>Interés</th><th>Amortizac.</th><th>Cuota Total</th><th>Saldo Final</th></tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            </div>`;

        const toggle = card.querySelector('.history-toggle');
        const detail = card.querySelector('.history-detail');
        const caret = card.querySelector('.history-caret');
        toggle.addEventListener('click', () => {
            const open = detail.style.display === 'block';
            detail.style.display = open ? 'none' : 'block';
            caret.textContent = open ? '▶' : '▼';
        });

        container.appendChild(card);
    });
}

// VAN: trae los flujos a valor presente a la tasa dada
function calcularVAN(flujos, tasa) {
    let van = flujos[0];
    for (let t = 1; t < flujos.length; t++) {
        van += flujos[t] / Math.pow(1 + tasa, t);
    }
    return van;
}

// TIR: Newton-Raphson sobre el flujo de caja del deudor
function calcularTIR(flujos, estimacion = 0.1) {
    const maxIter = 1000;
    const precision = 1e-7;
    let r = estimacion;

    for (let it = 0; it < maxIter; it++) {
        let f = 0, df = 0;
        for (let t = 0; t < flujos.length; t++) {
            const factor = Math.pow(1 + r, t);
            f += flujos[t] / factor;
            if (t > 0) df -= (t * flujos[t]) / (factor * (1 + r));
        }
        if (Math.abs(df) < 1e-12) break;
        const nuevoR = r - f / df;
        if (Math.abs(nuevoR - r) < precision) return nuevoR;
        r = nuevoR;
    }
    return r;
}

// RESUMEN EN VIVO — se actualiza mientras se configura, sin generar el cronograma
function setLive(cuota, tcea, total) {
    document.getElementById('live-cuota').textContent = cuota;
    document.getElementById('live-tcea').textContent = tcea;
    document.getElementById('live-total').textContent = total;
}

function updateLiveSummary() {
    if (!document.getElementById('live-summary')) return;
    if (!activeVehicle) { setLive('—', '—', '—'); return; }

    const currency = document.getElementById('sim-currency').value;
    const precio = currency === 'PEN' ? (activeVehicle.priceSoles ?? activeVehicle.price) : (activeVehicle.priceDollars ?? activeVehicle.price);
    if (!precio || precio <= 0) { setLive('—', '—', '—'); return; }

    const downPct = parseFloat(document.getElementById('sim-downpayment').value) / 100;
    const balloonPct = parseFloat(document.getElementById('sim-balloon').value) / 100;
    const bono = parseMoney(document.getElementById('sim-bono').value) || 0;
    const periodDays = parseInt(document.getElementById('sim-period').value);
    const months = parseInt(document.getElementById('sim-months').value);
    const rateType = document.getElementById('sim-rate-type').value;
    const rateVal = parseFloat(document.getElementById('sim-rate-val').value) / 100;
    const capDays = parseInt(document.getElementById('sim-capitalization').value);
    const segDesgPct = (parseFloat(document.getElementById('sim-seg-desgravamen').value) || 0) / 100;
    const segVehPct = (parseFloat(document.getElementById('sim-seg-vehicular').value) || 0) / 100;

    const montoFinanciar = precio - precio * downPct - bono;
    const balloon = precio * balloonPct;
    if (!rateVal || rateVal <= 0 || montoFinanciar <= 0 || balloon >= montoFinanciar) { setLive('—', '—', '—'); return; }

    const TEA = rateType === 'TE' ? rateVal : Math.pow(1 + rateVal / (360 / capDays), 360 / capDays) - 1;
    const i = Math.pow(1 + TEA, periodDays / 360) - 1;
    const n = Math.round(months * 30 / periodDays);
    const er = i + segDesgPct;
    const base = montoFinanciar - balloon / Math.pow(1 + er, n);
    const cuotaFija = er === 0 ? base / n : base * (er * Math.pow(1 + er, n)) / (Math.pow(1 + er, n) - 1);
    const sched = buildSchedule(montoFinanciar, i, cuotaFija, n, balloon, precio, segDesgPct, segVehPct);
    const total = sched.reduce((a, r) => a + r.cuotaTotal, 0);
    const flujo = [montoFinanciar];
    sched.forEach(r => flujo.push(-r.cuotaTotal));
    const tcea = Math.pow(1 + calcularTIR(flujo), 360 / periodDays) - 1;
    const sign = currency === 'PEN' ? 'S/' : '$';

    setLive(`${sign} ${formatMoney(sched[0].cuotaTotal)}`, `${(tcea * 100).toFixed(2)} %`, `${sign} ${formatMoney(total)}`);
}

['sim-currency', 'sim-tc', 'sim-downpayment', 'sim-balloon', 'sim-bono', 'sim-period', 'sim-months', 'sim-rate-type', 'sim-rate-val', 'sim-capitalization', 'sim-seg-desgravamen', 'sim-seg-vehicular']
    .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateLiveSummary);
    });

// Navegación del wizard: 3 pasos con acceso al estado del simulador
(function initWizard() {
    const form = document.getElementById('simulation-engine-form');
    const panels = [...document.querySelectorAll('.wizard-panel')];
    const steps = [...document.querySelectorAll('.wstep')];
    const liveBar = document.getElementById('live-summary');
    if (!form || !panels.length) return;
    let current = 1;

    function goTo(step) {
        current = step;
        panels.forEach(p => p.classList.toggle('active', +p.dataset.panel === step));
        steps.forEach(s => {
            const n = +s.dataset.step;
            s.classList.toggle('active', n === step);
            s.classList.toggle('done', n < step);
        });
        if (liveBar) liveBar.style.display = step >= 2 ? 'flex' : 'none';
        if (step >= 2) updateLiveSummary();
        document.querySelector('.wizard-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => {
        // El paso 1 exige cliente y vehículo antes de avanzar
        if (current === 1 && !(activeClient && activeVehicle)) {
            notify.err('Selecciona un cliente y un vehículo para continuar.');
            return;
        }
        goTo(+btn.dataset.next);
    }));
    document.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', () => goTo(+btn.dataset.prev)));
    steps.forEach(s => s.addEventListener('click', () => {
        if (+s.dataset.step < current) goTo(+s.dataset.step);
    }));

    // Enter en un campo no debe generar el plan antes del último paso
    form.addEventListener('submit', (e) => {
        if (current !== 3) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);

    // Alternar entre el wizard y la hoja de resultado (el resultado reemplaza la vista, no cuelga abajo)
    const wizardCard = document.querySelector('.wizard-card');
    const reportSection = document.getElementById('simulation-report-section');
    window.simShowResult = () => {
        wizardCard.style.display = 'none';
        if (liveBar) liveBar.style.display = 'none';
        reportSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.simShowWizard = () => {
        reportSection.style.display = 'none';
        wizardCard.style.display = '';
        if (liveBar) liveBar.style.display = current >= 2 ? 'flex' : 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.simResetWizard = () => { wizardCard.style.display = ''; goTo(1); };
    const editBtn = document.getElementById('btn-edit-sim');
    if (editBtn) editBtn.addEventListener('click', window.simShowWizard);

    // Cronograma colapsable
    const cronoToggle = document.getElementById('crono-toggle');
    const cronoBody = document.getElementById('crono-body');
    if (cronoToggle && cronoBody) {
        cronoToggle.addEventListener('click', () => {
            const open = cronoBody.hidden;
            cronoBody.hidden = !open;
            cronoToggle.closest('.collapsible').classList.toggle('open', open);
            cronoToggle.setAttribute('aria-expanded', open);
        });
    }

    goTo(1);
})();
