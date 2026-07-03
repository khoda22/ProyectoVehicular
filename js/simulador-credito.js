// Variables de control de datos cruzados
let activeClient = null;
let activeVehicle = null;
let rawSchedule = []; // Guarda la simulación base actual sin gracia
let modifiedSchedule = []; // Guarda la versión con gracia activa

// Control de Tabs del Menú
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if(tabId === 'tab-historial') renderFullHistory();
}

// Inicialización de selectores dependientes según tasa elegida
document.getElementById('sim-rate-type').addEventListener('change', updateRateDropdown);

function updateRateDropdown() {
    const type = document.getElementById('sim-rate-type').value;
    const rateSelect = document.getElementById('sim-rate-val');
    rateSelect.innerHTML = '';
    
    const options = type === 'TE' ? [10, 15, 20] : [9, 12, 15];
    options.forEach(val => {
        let opt = document.createElement('option');
        opt.value = val;
        opt.innerText = `${val} %`;
        rateSelect.appendChild(opt);
    });
}
updateRateDropdown(); // Ejecución inicial

// Búsqueda de Cliente cruzada
document.getElementById('btn-find-client').addEventListener('click', () => {
    const dni = document.getElementById('sim-client-id').value.trim();
    const list = JSON.parse(localStorage.getItem('system_clients')) || [];
    activeClient = list.find(c => c.id === dni);
    
    const status = document.getElementById('sim-client-info');
    if(activeClient) {
        status.innerHTML = `<span style="color:green;">✔ Validado: ${activeClient.name} (Ingresos: S/ ${activeClient.income})</span>`;
    } else {
        status.innerHTML = `<span style="color:red;">❌ No registrado en el sistema.</span>`;
        activeClient = null;
    }
    validateFormHability();
});

// Búsqueda de Vehículo cruzada
document.getElementById('btn-find-car').addEventListener('click', () => {
    const code = document.getElementById('sim-car-id').value.trim().toUpperCase();
    const list = JSON.parse(localStorage.getItem('system_vehicles')) || [];
    activeVehicle = list.find(v => v.id === code);
    
    const status = document.getElementById('sim-car-info');
    if(activeVehicle) {
        status.innerHTML = `<span style="color:green;">✔ Validado: ${activeVehicle.model} (Precio: S/ ${activeVehicle.price})</span>`;
    } else {
        status.innerHTML = `<span style="color:red;">❌ Vehículo no encontrado en inventario.</span>`;
        activeVehicle = null;
    }
    validateFormHability();
});

function validateFormHability() {
    document.getElementById('btn-calc-simulation').disabled = !(activeClient && activeVehicle);
}

// MOTOR DE OPERACIONES FINANCIERAS
document.getElementById('simulation-engine-form').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateFinancialPlan();
});

function calculateFinancialPlan() {
    const currency = document.getElementById('sim-currency').value;
    const downPct = parseFloat(document.getElementById('sim-downpayment').value) / 100;
    const period = parseInt(document.getElementById('sim-period').value);
    const years = parseInt(document.getElementById('sim-years').value);
    const rateType = document.getElementById('sim-rate-type').value;
    const rateVal = parseFloat(document.getElementById('sim-rate-val').value) / 100;

    let perC = 12; 
    if(period === 15) perC = 24;
    if(period === 7) perC = 48;

    let PV = activeVehicle.price;
    let cuotaInicial = PV * downPct;
    let C = PV - cuotaInicial; // Saldo neto financiado base

    let n = years * perC;

    let TE = 0;
    if (rateType === 'TE') {
        TE = Math.pow((1 + rateVal), (period / 360)) - 1;
    } else {
        TE = Math.pow((1 + (rateVal / perC)), 1) - 1;
    }

    let R = C * (TE / (1 - Math.pow(1 + TE, -n)));

    // Construcción primaria del Cronograma
    rawSchedule = runAmortizationEngine(C, TE, R, n, currency);
    modifiedSchedule = JSON.parse(JSON.stringify(rawSchedule)); 
    
    // Ejecutar procesamiento y despliegue de indicadores normativos y semáforo
    processRegulatoryIndicators(C, currency, period, perC);
    renderScheduleTable(modifiedSchedule, currency);
    document.getElementById('simulation-report-section').style.display = 'block';
}

function runAmortizationEngine(saldoInicial, TE, cuotaFija, totalCuotas, currency) {
    let schedule = [];
    let currentSaldo = saldoInicial;

    for (let i = 1; i <= totalCuotas; i++) {
        let interes = currentSaldo * TE;
        let cuota = cuotaFija;
        let amortizacion = cuota - interes;
        let saldoFinal = currentSaldo - amortizacion;

        if (saldoFinal < 0 || i === totalCuotas) {
            saldoFinal = 0;
            cuota = currentSaldo + interes;
            amortizacion = currentSaldo;
        }

        // Si es Dólares, transformamos los outputs usando la paridad 3.40 SOL = 1 USD
        const factor = currency === 'USD' ? 3.40 : 1;

        schedule.push({
            num: i,
            saldoInicial: currentSaldo / factor,
            interes: interes / factor,
            cuota: cuota / factor,
            amortizacion: amortizacion / factor,
            saldoFinal: saldoFinal / factor,
            rawTE: TE // Preservado para recálculos de gracia
        });

        currentSaldo = saldoFinal;
        if(currentSaldo <= 0) break;
    }
    return schedule;
}

// Renderizado de la tabla en pantalla
function renderScheduleTable(data, currency) {
    const tbody = document.querySelector('#table-cronograma tbody');
    tbody.innerHTML = '';
    const sign = currency === 'PEN' ? 'S/' : '$';

    data.forEach(row => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.num}</td>
            <td>${sign} ${row.saldoInicial.toFixed(2)}</td>
            <td>${sign} ${row.interes.toFixed(2)}</td>
            <td style="font-weight:600; color:var(--dark-blue);">${sign} ${row.cuota.toFixed(2)}</td>
            <td>${sign} ${row.amortizacion.toFixed(2)}</td>
            <td>${sign} ${row.saldoFinal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('report-summary-text').innerText = 
        `Moneda del Reporte: ${currency === 'PEN' ? 'Soles' : 'Dólares (T.C. 3.40)'}. Total de periodos procesados: ${data.length}.`;
}

// GESTIÓN DE PERIODO DE GRACIA TOTAL O PARCIAL
document.getElementById('btn-apply-gracia').addEventListener('click', () => {
    const type = document.getElementById('gracia-type').value;
    const targetInput = document.getElementById('gracia-target').value;
    const currency = document.getElementById('sim-currency').value;

    if (type === 'NINGUNO') {
        modifiedSchedule = JSON.parse(JSON.stringify(rawSchedule));
        renderScheduleTable(modifiedSchedule, currency);
        alert('Periodos de gracia restablecidos.');
        return;
    }

    // Convertir el input de texto en un array de números de cuota válidos
    const targetCuotas = targetInput.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));

    if(targetCuotas.length === 0) {
        alert('Escriba al menos un número de cuota válido.');
        return;
    }

    // Recálculo del flujo completo respetando la gracia inyectada
    let schedule = [];
    let currentSaldo = rawSchedule[0].saldoInicial; // Comenzamos desde el monto original financiado
    let TE = rawSchedule[0].rawTE;
    
    // Recalculamos la cuota fija base basada en las cuotas restantes no afectadas si hiciera falta,
    // o procesamos en cascada manteniendo la estructura matemática:
    for (let i = 1; i <= rawSchedule.length; i++) {
        let interes = currentSaldo * TE;
        let cuota = rawSchedule[i-1].cuota; // Hereda la cuota calculada inicial
        let amortizacion = cuota - interes;

        if (targetCuotas.includes(i)) {
            if (type === 'TOTAL') {
                cuota = 0;
                amortizacion = 0;
                // En gracia total real, el interés se capitaliza al saldo final
                // saldoFinal = saldoInicial + interes
                // Manteniendo el requerimiento matemático base de cascada:
                interes = currentSaldo * TE; 
            } else if (type === 'PARCIAL') {
                amortizacion = 0;
                cuota = interes; // Solo se pagan intereses
            }
        }

        let saldoFinal = currentSaldo - amortizacion;
        if(type === 'TOTAL' && targetCuotas.includes(i)) {
            saldoFinal = currentSaldo + interes; // Capitalización de interés por gracia total
        }

        if (i === rawSchedule.length) {
            saldoFinal = 0;
            if (!targetCuotas.includes(i)) {
                cuota = currentSaldo + interes;
                amortizacion = currentSaldo;
            }
        }

        schedule.push({
            num: i,
            saldoInicial: currentSaldo,
            interes: interes,
            cuota: cuota,
            amortizacion: amortizacion,
            saldoFinal: saldoFinal,
            rawTE: TE
        });

        currentSaldo = saldoFinal;
    }

    modifiedSchedule = schedule;
    renderScheduleTable(modifiedSchedule, currency);
    alert('Cronograma recalculado con el Periodo de Gracia aplicado.');
});

// GUARDAR SIMULACIÓN EN HISTORIAL
document.getElementById('btn-save-final').addEventListener('click', () => {
    const history = JSON.parse(localStorage.getItem('system_simulations')) || [];
    
    const finalSimulation = {
        id: 'SIM-' + Date.now().toString().slice(-6),
        clientDni: activeClient.id,
        clientName: activeClient.name,
        carModel: activeVehicle.model,
        bank: document.getElementById('sim-bank').value,
        currency: document.getElementById('sim-currency').value,
        date: new Date().toLocaleDateString(),
        schedule: modifiedSchedule
    };

    history.push(finalSimulation);
    localStorage.setItem('system_simulations', JSON.stringify(history));

    alert(`Simulación ${finalSimulation.id} guardada exitosamente en el historial del cliente.`);
    resetSimulationWorkspace();
});

function resetSimulationWorkspace() {
    document.getElementById('simulation-engine-form').reset();
    document.getElementById('simulation-report-section').style.display = 'none';
    document.getElementById('sim-client-info').innerHTML = '';
    document.getElementById('sim-car-info').innerHTML = '';
    activeClient = null;
    activeVehicle = null;
    validateFormHability();
}

// FILTRADO Y RENDERIZADO DEL HISTORIAL DE SIMULACIONES
function renderFullHistory() {
    const container = document.getElementById('history-list-container');
    container.innerHTML = '';
    const history = JSON.parse(localStorage.getItem('system_simulations')) || [];

    if(history.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No hay simulaciones registradas en el sistema.</p>';
        return;
    }

    buildHistoryCards(history, container);
}

document.getElementById('btn-filter-history').addEventListener('click', () => {
    const dni = document.getElementById('search-history-dni').value.trim();
    const container = document.getElementById('history-list-container');
    const history = JSON.parse(localStorage.getItem('system_simulations')) || [];

    const filtered = history.filter(s => s.clientDni === dni);

    if(filtered.length === 0) {
        container.innerHTML = '<p style="color:red; text-align:center;">No se encontraron simulaciones para el DNI ingresado.</p>';
        return;
    }

    buildHistoryCards(filtered, container);
});

function buildHistoryCards(list, container) {
    container.innerHTML = '';
    list.forEach(sim => {
        const sign = sim.currency === 'PEN' ? 'S/' : '$';
        let card = document.createElement('div');
        card.className = 'history-item-card';
        card.style = 'border:1px solid var(--border-color); border-radius:8px; padding:20px; margin-bottom:20px; background:white;';
        
        let rowsHtml = '';
        sim.schedule.forEach(r => {
            rowsHtml += `
                <tr>
                    <td>${r.num}</td>
                    <td>${sign} ${r.saldoInicial.toFixed(2)}</td>
                    <td>${sign} ${r.interes.toFixed(2)}</td>
                    <td>${sign} ${r.cuota.toFixed(2)}</td>
                    <td>${sign} ${r.amortizacion.toFixed(2)}</td>
                    <td>${sign} ${r.saldoFinal.toFixed(2)}</td>
                </tr>
            `;
        });

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:10px; margin-bottom:15px;">
                <div>
                    <h4 style="color:var(--dark-blue); font-size:16px;">${sim.id} - ${sim.clientName} (DNI: ${sim.clientDni})</h4>
                    <p style="font-size:13px; color:var(--text-muted);">Vehículo: ${sim.carModel} | Entidad: ${sim.bank} | Fecha: ${sim.date}</p>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="banking-table text-small">
                    <thead>
                        <tr>
                            <th>Nro Cuota</th>
                            <th>Saldo Inicial</th>
                            <th>Interés</th>
                            <th>Cuota</th>
                            <th>Amortizac.</th>
                            <th>Saldo Final</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
        container.appendChild(card);
    });
}

// PROCESADOR DE TRANSPARENCIA SBS Y EVALUACIÓN DE INGRESO (LOGICA ACTUALIZADA)
function processRegulatoryIndicators(montoPrestamo, currency, period, perC) {
    const factor = currency === 'USD' ? 3.40 : 1;
    const montoFinanciadoMoneda = montoPrestamo / factor;
    const primeraCuota = modifiedSchedule[0].cuota;
    const ingresosClienteMoneda = activeClient.income / factor; // Homologación monetaria

    // NUEVA LÓGICA: El ingreso comparado frente a la primera cuota
    const ratioEvaluacion = (ingresosClienteMoneda / primeraCuota) * 100;
    
    const semaforoContainer = document.getElementById('risk-semaphore-container');
    const badgeText = document.getElementById('risk-client-badge');
    const ratioText = document.getElementById('risk-client-ratio');

    ratioText.innerText = `El ingreso mensual del cliente representa el ${ratioEvaluacion.toFixed(2)}% del valor de la primera cuota.`;

    // Evaluación del semáforo según tus nuevos parámetros
    if (ratioEvaluacion <= 50) {
        semaforoContainer.style.backgroundColor = '#fee2e2'; // Rojo suave
        semaforoContainer.style.color = '#991b1b';
        badgeText.innerText = `SOLICITANTE: NO FACTIBLE (ROJO)`;
    } else if (ratioEvaluacion <= 70) {
        semaforoContainer.style.backgroundColor = '#fef3c7'; // Amarillo suave
        semaforoContainer.style.color = '#92400e';
        badgeText.innerText = `SOLICITANTE: RIESGO MODERADO (AMARILLO)`;
    } else {
        semaforoContainer.style.backgroundColor = '#dcfce7'; // Verde suave
        semaforoContainer.style.color = '#166534';
        badgeText.innerText = `SOLICITANTE: FACTIBLE / APTO (VERDE)`;
    }

    // El resto del código de flujos, VAN, TIR y TCEA se mantiene exactamente igual...
    let flujosEfectivo = [montoFinanciadoMoneda];
    modifiedSchedule.forEach(item => {
        flujosEfectivo.push(-item.cuota);
    });

    let tasaPeriodo = modifiedSchedule[0].rawTE;
    let vanCalculado = calcularVAN(flujosEfectivo, tasaPeriodo);
    let tirCalculada = calcularTIR(flujosEfectivo);
    let tceaCalculada = Math.pow(1 + tirCalculada, (360 / period)) - 1;

    const sign = currency === 'PEN' ? 'S/' : '$';
    document.getElementById('sbs-van').innerText = `${sign} ${vanCalculado.toFixed(2)}`;
    document.getElementById('sbs-tir').innerText = `${(tirCalculada * 100).toFixed(4)} % (per.)`;
    document.getElementById('sbs-tcea').innerText = `${(tceaCalculada * 100).toFixed(2)} %`;
}

// Algoritmo matemático para el Valor Actual Neto (VAN)
function calcularVAN(flujos, tasa) {
    let van = flujos[0]; // Desembolso inicial (+)
    for (let t = 1; t < flujos.length; t++) {
        van += flujos[t] / Math.pow(1 + tasa, t);
    }
    return van;
}

// Algoritmo numérico iterativo de Newton-Raphson para obtener la TIR
function calcularTIR(flujos, estimacion = 0.1) {
    const maxIteraciones = 1000;
    const precisionRequerida = 1e-7;
    let r = estimacion;

    for (let i = 0; i < maxIteraciones; i++) {
        let f = 0;
        let df = 0;

        for (let t = 0; t < flujos.length; t++) {
            let factor = Math.pow(1 + r, t);
            f += flujos[t] / factor;
            if (t > 0) {
                df -= (t * flujos[t]) / (factor * (1 + r));
            }
        }

        if (Math.abs(df) < 1e-12) break; // Evitar división por cero imprevista

        let nuevoR = r - f / df;

        if (Math.abs(nuevoR - r) < precisionRequerida) {
            return nuevoR;
        }
        r = nuevoR;
    }
    return r; // Devuelve la tasa interna de retorno periódica aproximada
}