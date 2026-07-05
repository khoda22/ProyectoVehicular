function formatMoney(value) {
    const n = Number(value);
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseMoney(str) {
    if (typeof str === 'number') return str;
    if (str === null || str === undefined || str === '') return NaN;
    return parseFloat(String(str).replace(/,/g, '').trim());
}

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

// Patrón "touched": valida al salir del campo, no en cada tecla (evita marcar el error mientras se escribe)
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
    return () => { touched = true; return run(true); };
}

const validators = {
    dni: v => /^\d{8}$/.test(v) || /^[a-zA-Z0-9]{9,12}$/.test(v) || 'Ingresa un DNI o CE válido.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Correo no válido.',
    phone: v => /^\d{6,12}$/.test(v.replace(/\s/g, '')) || 'Teléfono no válido.',
    positive: v => (parseMoney(v) > 0) || 'Ingresa un monto válido.',
    year: v => { const y = parseInt(v); return (y >= 1900 && y <= 2027) || 'Año entre 1900 y 2027.'; },
    // Contraseña segura (estándar de instituciones financieras)
    strongPassword: v => {
        if (v.length < 8) return 'Mínimo 8 caracteres.';
        if (!/[A-Z]/.test(v)) return 'Debe incluir una mayúscula.';
        if (!/[a-z]/.test(v)) return 'Debe incluir una minúscula.';
        if (!/[0-9]/.test(v)) return 'Debe incluir un número.';
        if (!/[^A-Za-z0-9]/.test(v)) return 'Debe incluir un símbolo (!@#$…).';
        return true;
    }
};

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
