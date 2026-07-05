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

// Convierte un input de texto en un buscador con dropdown de resultados (typeahead)
function createTypeahead({ inputId, getList, match, label, onSelect, emptyText }) {
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

    function render(q) {
        const query = (q || '').toLowerCase();
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

    input.addEventListener('input', () => {
        if (selected) { selected = null; onSelect(null); }
        render(input.value);
    });
    input.addEventListener('focus', () => render(input.value));
    input.addEventListener('blur', () => setTimeout(() => { menu.style.display = 'none'; }, 150));

    return {
        getSelected: () => selected,
        clear: () => { input.value = ''; selected = null; menu.style.display = 'none'; }
    };
}
