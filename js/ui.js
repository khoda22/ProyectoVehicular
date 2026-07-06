// Tooltip global posicionado con position:fixed → no lo recorta ningún contenedor con overflow (modales, tablas)
(function initTooltips() {
    let tip = null;
    function hide() { if (tip) { tip.remove(); tip = null; } }
    function show(el) {
        const text = el.getAttribute('data-tip');
        if (!text) return;
        hide();
        tip = document.createElement('div');
        tip.className = 'tip-floating';
        tip.textContent = text;
        document.body.appendChild(tip);
        const r = el.getBoundingClientRect();
        const t = tip.getBoundingClientRect();
        let top = r.top - t.height - 8;
        if (top < 8) top = r.bottom + 8;              // si no cabe arriba, va abajo
        let left = r.left + r.width / 2 - t.width / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - t.width - 8)); // no sale de la pantalla
        tip.style.top = top + 'px';
        tip.style.left = left + 'px';
        requestAnimationFrame(() => tip && tip.classList.add('visible'));
    }
    document.addEventListener('mouseover', e => { const el = e.target.closest('.help-tip'); if (el) show(el); });
    document.addEventListener('mouseout', e => { if (e.target.closest('.help-tip')) hide(); });
    window.addEventListener('scroll', hide, true);
})();

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

// Confirmación con la identidad de la app (reemplaza al confirm() nativo). Devuelve Promise<boolean>.
// Uso: if (!(await confirmDialog('¿Eliminar este cliente?'))) return;
function confirmDialog(message, opts = {}) {
    const { title = 'Confirmar acción', confirmText = 'Eliminar', cancelText = 'Cancelar', danger = true } = opts;
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay confirm-overlay';

        const card = document.createElement('div');
        card.className = 'modal-card confirm-card';
        card.setAttribute('role', 'alertdialog');
        card.setAttribute('aria-modal', 'true');

        const icon = document.createElement('div');
        icon.className = 'confirm-icon' + (danger ? ' danger' : '');
        icon.innerHTML = '<i class="hgi-stroke hgi-alert-02"></i>';

        const h = document.createElement('h3');
        h.className = 'confirm-title';
        h.textContent = title;                         // textContent → seguro ante datos del usuario

        const p = document.createElement('p');
        p.className = 'confirm-message';
        p.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn-secondary btn-inline';
        btnCancel.textContent = cancelText;
        const btnOk = document.createElement('button');
        btnOk.type = 'button';
        btnOk.className = 'btn-inline ' + (danger ? 'btn-danger' : 'btn-login');
        btnOk.textContent = confirmText;
        actions.append(btnCancel, btnOk);

        card.append(icon, h, p, actions);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        const close = (val) => {
            document.removeEventListener('keydown', onKey);
            overlay.remove();
            resolve(val);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') close(false);
            else if (e.key === 'Enter') close(true);
        };
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(false); });
        btnCancel.addEventListener('click', () => close(false));
        btnOk.addEventListener('click', () => close(true));
        document.addEventListener('keydown', onKey);
        requestAnimationFrame(() => btnOk.focus());
    });
}
window.confirmDialog = confirmDialog;

// Marca visualmente los campos obligatorios (asterisco + leyenda) a partir del atributo required.
// Es automático: cualquier form con [required] queda señalizado sin editar label por label.
(function markRequiredFields() {
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            const group = field.closest('.input-group, .form-group') || field.parentElement;
            const label = group ? group.querySelector('label') : null;
            // Se omiten los labels que envuelven al propio control (ej. checkboxes de consentimiento)
            if (label && !label.querySelector('.label-req') && !label.querySelector('input, select, textarea')) {
                const star = document.createElement('span');
                star.className = 'label-req';
                star.setAttribute('aria-hidden', 'true');
                star.textContent = ' *';
                label.appendChild(star);
            }
        });
        document.querySelectorAll('form').forEach(form => {
            if (form.querySelector('[required]') && !form.querySelector('.form-req-legend')) {
                const legend = document.createElement('p');
                legend.className = 'form-req-legend';
                legend.innerHTML = '<span class="label-req">*</span> Campos obligatorios';
                form.prepend(legend);
            }
        });
    });
})();
