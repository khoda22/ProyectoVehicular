// ============================================================
// Utilidades de UI compartidas
// ============================================================

// Formatea un número como monto: 1200 -> "1,200.00"
function formatMoney(value) {
    const n = Number(value);
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Convierte texto a número aceptando separadores de miles: "1,200.00" -> 1200
function parseMoney(str) {
    if (typeof str === 'number') return str;
    if (str === null || str === undefined || str === '') return NaN;
    return parseFloat(String(str).replace(/,/g, '').trim());
}

// Normaliza un input de texto monetario: al salir del campo formatea 1200 -> 1,200.00
function attachMoneyFormat(input) {
    if (!input) return;
    input.addEventListener('focus', () => {
        const n = parseMoney(input.value);
        input.value = isNaN(n) ? '' : String(n);   // sin formato para editar cómodo
    });
    input.addEventListener('blur', () => {
        const n = parseMoney(input.value);
        input.value = isNaN(n) ? '' : formatMoney(n);
    });
}

// Validación con patrón "touched": no molesta mientras el usuario escribe por primera vez.
// Valida al salir del campo (blur); a partir de ahí da feedback en vivo (limpia el error apenas es válido).
function attachValidation(input, errorEl, validator) {
    if (!input) return () => true;
    let touched = false;
    const run = (show) => {
        const val = input.value.trim();
        if (val === '') {
            input.classList.remove('invalid');
            if (errorEl) errorEl.textContent = '';
            return false;
        }
        const res = validator(val);
        if (res === true) {
            input.classList.remove('invalid');
            if (errorEl) errorEl.textContent = '';
            return true;
        }
        if (show) {
            input.classList.add('invalid');
            if (errorEl) errorEl.textContent = res;
        }
        return false;
    };
    input.addEventListener('blur', () => { touched = true; run(true); });
    input.addEventListener('input', () => run(touched));
    // Para validar al enviar el formulario: fuerza mostrar el error
    return () => { touched = true; return run(true); };
}

// Validadores comunes reutilizables — mensajes de una sola línea (evitan saltos de layout)
const validators = {
    dni: v => /^\d{8}$/.test(v) || /^[a-zA-Z0-9]{9,12}$/.test(v) || 'Ingresa un DNI o CE válido.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Correo no válido.',
    phone: v => /^\d{6,12}$/.test(v.replace(/\s/g, '')) || 'Teléfono no válido.',
    positive: v => (parseMoney(v) > 0) || 'Ingresa un monto válido.',
    year: v => { const y = parseInt(v); return (y >= 1900 && y <= 2027) || 'Año entre 1900 y 2027.'; }
};

// Convierte un input de texto en un buscador con dropdown de resultados (typeahead)
function createTypeahead({ inputId, getList, match, label, onSelect, emptyText, minChars = 1, delay = 220 }) {
    const input = document.getElementById(inputId);
    if (!input) return null;
    input.setAttribute('autocomplete', 'off');

    const wrap = document.createElement('div');
    wrap.className = 'typeahead-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const menu = document.createElement('div');
    menu.className = 'typeahead-menu';
    menu.style.display = 'none';
    wrap.appendChild(menu);

    let selected = null;

    function hideMenu() { menu.style.display = 'none'; }

    function render(q) {
        const query = (q || '').trim().toLowerCase();
        // No buscar hasta tener el mínimo de caracteres: evita volcar toda la lista al enfocar
        if (query.length < minChars) { hideMenu(); return; }
        const list = getList().filter(item => match(item, query));
        menu.innerHTML = '';
        if (list.length === 0) {
            menu.innerHTML = `<div class="typeahead-empty">${emptyText || 'Sin resultados'}</div>`;
        } else {
            list.slice(0, 8).forEach(item => {
                const opt = document.createElement('div');
                opt.className = 'typeahead-item';
                opt.textContent = label(item);
                opt.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    input.value = label(item);
                    selected = item;
                    menu.style.display = 'none';
                    onSelect(item);
                });
                menu.appendChild(opt);
            });
        }
        menu.style.display = 'block';
    }

    // Debounce: no dispara la búsqueda en cada tecla, espera a que el usuario deje de escribir
    let searchTimer = null;
    input.addEventListener('input', () => {
        if (selected) { selected = null; onSelect(null); }
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => render(input.value), delay);
    });
    input.addEventListener('focus', () => { if (!selected && input.value.trim()) render(input.value); });
    input.addEventListener('blur', () => setTimeout(hideMenu, 150));

    return {
        getSelected: () => selected,
        clear: () => { input.value = ''; selected = null; menu.style.display = 'none'; }
    };
}
