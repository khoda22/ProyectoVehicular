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

// Buscadores typeahead (escribe y filtra; no listas completas)
let activeBank = '';

createTypeahead({
    inputId: 'sim-client-id',
    getList: () => JSON.parse(localStorage.getItem('system_clients')) || [],
    match: (c, q) => c.id.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q),
    label: c => `${c.name} — DNI ${c.id}`,
    emptyText: 'No hay clientes registrados.',
    onSelect: (c) => {
        activeClient = c;
        const info = document.getElementById('sim-client-info');
        info.innerHTML = c ? `<span style="color:#166534;">✔ ${c.name} · Ingresos: S/ ${formatMoney(c.income)}</span>` : '';
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
        const info = document.getElementById('sim-car-info');
        if (v) {
            const pen = v.priceSoles ?? v.price ?? 0;
            const usd = v.priceDollars ?? 0;
            info.innerHTML = `<span style="color:#166534;">✔ ${v.brand || ''} ${v.model} · S/ ${formatMoney(pen)} / $ ${formatMoney(usd)}</span>`;
        } else {
            info.innerHTML = '';
        }
        validateFormHability();
    }
});

createTypeahead({
    inputId: 'sim-bank',
    getList: () => JSON.parse(localStorage.getItem('system_entities')) || [],
    match: (e, q) => (e.name || '').toLowerCase().includes(q) || (e.ruc || '').toLowerCase().includes(q),
    label: e => `${e.name} (RUC ${e.ruc})`,
    emptyText: 'No hay entidades registradas.',
    onSelect: (e) => { activeBank = e ? e.name : ''; }
});

// Sliders con valor en vivo y relleno de color
const SLIDERS = [
    ['sim-downpayment', 'val-downpayment', ' %'],
    ['sim-balloon', 'val-balloon', ' %'],
    ['sim-years', 'val-years', ' años']
];
function paintSlider(id, outId, unit) {
    const el = document.getElementById(id);
    if (!el) return;
    const out = document.getElementById(outId);
    const min = parseFloat(el.min) || 0;
    const max = parseFloat(el.max) || 100;
    const pct = ((parseFloat(el.value) - min) / (max - min)) * 100;
    el.style.background = `linear-gradient(90deg, var(--primary) ${pct}%, var(--primary-soft) ${pct}%)`;
    if (out) out.textContent = (unit === ' años' && el.value === '1') ? '1 año' : el.value + unit;
}
function paintAllSliders() { SLIDERS.forEach(s => paintSlider(...s)); }
SLIDERS.forEach(([id, outId, unit]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => paintSlider(id, outId, unit));
});
paintAllSliders();

// La capitalización solo aplica cuando la tasa es nominal (exigencia del enunciado)
const rateTypeSelect = document.getElementById('sim-rate-type');
rateTypeSelect.addEventListener('change', () => {
    document.getElementById('sim-capitalization').disabled = rateTypeSelect.value !== 'TN';
});

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
    const years = parseInt(document.getElementById('sim-years').value);
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
    const n = Math.round(years * 360 / periodDays);

    // Cuota francesa ajustada por el valor presente de la cuota balloon
    const pvBalloon = balloon / Math.pow(1 + i, n);
    const base = montoFinanciar - pvBalloon;
    const cuotaFija = i === 0 ? base / n : base * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

    currentParams = { currency, precio, montoFinanciar, balloon, i, n, TEA, periodDays, segDesgPct, segVehPct, cuotaFija };

    baseSchedule = buildSchedule(montoFinanciar, i, cuotaFija, n, balloon, precio, segDesgPct, segVehPct);
    workingSchedule = baseSchedule.map(r => ({ ...r }));

    processIndicators();
    renderScheduleTable(workingSchedule);
    document.getElementById('simulation-report-section').style.display = 'block';
}

// Construye el cronograma; la cuota balloon se paga como residual en el último periodo
function buildSchedule(monto, i, cuota, n, balloon, precio, dDesg, dVeh) {
    const rows = [];
    let saldo = monto;

    for (let k = 1; k <= n; k++) {
        const interes = saldo * i;
        let amort = cuota - interes;
        let bal = 0;
        let saldoFinal = saldo - amort;

        if (k === n) {
            amort = cuota - interes;
            bal = saldo - amort;   // residual real: absorbe el redondeo y equivale a la balloon
            saldoFinal = 0;
        }

        const segDesg = saldo * dDesg;
        const segVeh = precio * dVeh;
        const cuotaFin = interes + amort + bal;
        const cuotaTotal = cuotaFin + segDesg + segVeh;

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
    document.getElementById('report-summary-text').innerText =
        `Moneda: ${p.currency === 'PEN' ? 'Soles' : 'Dólares'} | TEA: ${(p.TEA * 100).toFixed(2)}% | Monto financiado: ${sign} ${formatMoney(p.montoFinanciar)} | Cuota balloon: ${sign} ${formatMoney(p.balloon)} | Total pagado: ${sign} ${formatMoney(totalPagado)}`;
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
            amort = p.cuotaFija - interes;
            saldoFinal = saldo - amort;
            cuotaFin = interes + amort;
        }

        if (k === p.n) {
            bal = saldoFinal;               // el saldo remanente se cancela como cuota balloon
            saldoFinal = 0;
            cuotaFin = interes + amort + bal;
        }

        const segDesg = saldo * p.segDesgPct;
        const segVeh = p.precio * p.segVehPct;
        rows.push({ num: k, saldoInicial: saldo, interes, amortizacion: amort, balloon: bal, segDesg, segVeh, cuota: cuotaFin, cuotaTotal: cuotaFin + segDesg + segVeh, saldoFinal });
        saldo = saldoFinal;
    }

    workingSchedule = rows;
    processIndicators();
    renderScheduleTable(workingSchedule);
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
        bank: activeBank || document.getElementById('sim-bank').value,
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

function resetSimulationWorkspace() {
    document.getElementById('simulation-engine-form').reset();
    document.getElementById('simulation-report-section').style.display = 'none';
    document.getElementById('sim-client-info').innerHTML = '';
    document.getElementById('sim-car-info').innerHTML = '';
    document.getElementById('sim-capitalization').disabled = true;
    paintAllSliders();
    activeClient = null;
    activeVehicle = null;
    activeBank = '';
    currentParams = null;
    validateFormHability();
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
