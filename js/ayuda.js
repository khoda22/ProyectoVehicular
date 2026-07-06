const HELP_MANUALS = {
    asesor: {
        label: 'Asesor',
        intro: 'Este manual acompaña al asesor desde el registro del prospecto hasta la entrega de su cotización.',
        sections: [
            {
                id: 'inicio',
                icon: 'hgi-home-01',
                title: 'Primeros pasos',
                lead: 'Ingresa con tu cuenta institucional y reconoce las áreas principales.',
                image: 'manual-assets/manual-login.png',
                steps: [
                    ['Inicia sesión', 'Escribe el usuario y contraseña asignados por el administrador.'],
                    ['Confirma la validación', 'Marca “No soy un robot” y selecciona Acceder al Sistema.'],
                    ['Ubica el menú lateral', 'Desde allí puedes abrir Créditos, Clientes, Vehículos y Ayuda.']
                ],
                tip: 'Nunca compartas tus credenciales. Si olvidaste la contraseña, solicita el restablecimiento al administrador.'
            },
            {
                id: 'clientes',
                icon: 'hgi-user-multiple',
                title: 'Registrar y editar clientes',
                lead: 'Conserva los datos de contacto y el consentimiento necesarios para la evaluación.',
                image: 'manual-assets/manual-clientes.png',
                steps: [
                    ['Abre Clientes', 'Selecciona Clientes en el menú y pulsa “Nuevo cliente”.'],
                    ['Completa la ficha', 'Registra DNI o CE, nombres, correo, teléfonos e ingreso mensual.'],
                    ['Registra el consentimiento', 'La autorización para tratar los datos es obligatoria.'],
                    ['Edita cuando sea necesario', 'Usa el botón Editar; el documento de identidad permanece bloqueado por ser la clave del registro.']
                ],
                warning: 'Verifica el DNI y los datos de contacto antes de guardar. Los mensajes bajo cada campo indican el formato esperado.'
            },
            {
                id: 'vehiculos',
                icon: 'hgi-car-01',
                title: 'Gestionar vehículos',
                lead: 'Registra las unidades disponibles y sus precios en ambas monedas.',
                image: 'manual-assets/manual-vehiculos.png',
                steps: [
                    ['Abre Vehículos', 'Pulsa “Nuevo vehículo” para crear una unidad.'],
                    ['Identifica la unidad', 'Completa código interno, marca, modelo y año.'],
                    ['Registra ambos precios', 'Ingresa el precio en soles y dólares para permitir contratos en cualquiera de las monedas.'],
                    ['Actualiza la información', 'La opción Editar permite corregir características y precios.']
                ],
                tip: 'Utiliza códigos únicos y reconocibles, por ejemplo TOY-001.'
            },
            {
                id: 'simulacion',
                icon: 'hgi-invoice-01',
                title: 'Crear una simulación',
                lead: 'El asistente organiza la operación en tres pasos para reducir errores.',
                image: 'manual-assets/manual-simulador.png',
                steps: [
                    ['Cliente y vehículo', 'Busca por DNI, nombre, código, modelo o marca y selecciona ambos registros.'],
                    ['Estructura del crédito', 'Define moneda, cuota inicial, plazo, cuota balloon, bono y periodo de pago.'],
                    ['Periodo de gracia', 'Al inicio de la operación elige el tipo de gracia (total o parcial) y cuántas cuotas iniciales abarca; la entidad fija el máximo permitido.'],
                    ['Tasa y seguros', 'Confirma TEA o TNA, capitalización y los seguros configurados por la entidad.'],
                    ['Genera el plan', 'Revisa el resumen en vivo y pulsa “Generar plan de pagos”.']
                ],
                tip: 'Pasa el cursor sobre los símbolos “?” para conocer la definición y restricciones de cada campo.'
            },
            {
                id: 'resultados',
                icon: 'hgi-chart-line-data-01',
                title: 'Interpretar resultados',
                lead: 'Presenta al cliente una explicación clara del costo y comportamiento del crédito.',
                image: 'manual-assets/manual-resultados.png',
                steps: [
                    ['Cuota y plazo', 'Muestran el pago total periódico y el número de cuotas.'],
                    ['Semáforo de riesgo', 'Evalúa la capacidad de pago según la carga financiera (cuota mensual ÷ ingreso del cliente): “Solicitante apto” hasta 40% —límite recomendado por la SBS—, “Riesgo moderado” entre 40% y 60%, y “Solicitante no factible” por encima del 60%. Si el cliente no registra ingreso, no puede evaluarse.'],
                    ['TEA y TCEA', 'La TEA representa el interés efectivo; la TCEA incorpora intereses y seguros.'],
                    ['VAN y TIR', 'Validan matemáticamente el flujo desde el punto de vista del deudor.'],
                    ['Cronograma', 'Detalla saldo inicial, interés, amortización, seguros, cuota y saldo final.']
                ],
                warning: 'La simulación es referencial. Confirma las condiciones vigentes de la entidad antes de formalizar la operación.'
            },
            {
                id: 'historial',
                icon: 'hgi-folder-search',
                title: 'Guardar, consultar y exportar',
                lead: 'Conserva cada alternativa evaluada y entrega una cotización ordenada.',
                steps: [
                    ['Guarda la simulación', 'Pulsa “Guardar simulación” después de revisar los resultados.'],
                    ['Consulta el historial', 'Abre “Mostrar Simulaciones” y busca mediante el DNI del cliente.'],
                    ['Descarga el PDF', 'Genera la cotización con resumen financiero y cronograma.'],
                    ['Protege la información', 'No compartas documentos con personas distintas al titular autorizado.']
                ],
                tip: 'Un cliente puede tener varias simulaciones para comparar plazo, moneda o cuota inicial.'
            },
            {
                id: 'errores',
                icon: 'hgi-alert-02',
                title: 'Errores frecuentes',
                lead: 'Estas comprobaciones resuelven la mayoría de incidencias durante la atención.',
                faq: [
                    ['No puedo continuar al paso siguiente', 'Selecciona un cliente y un vehículo válidos desde las sugerencias de búsqueda.'],
                    ['No se genera el plan', 'Comprueba que la tasa sea mayor que cero y que la cuota balloon sea menor al monto financiado.'],
                    ['No encuentro una simulación', 'Verifica que fue guardada y busca con el DNI exacto del cliente.'],
                    ['El precio no aparece', 'Edita el vehículo y confirma que tenga precio en la moneda seleccionada.']
                ]
            }
        ]
    },
    admin: {
        label: 'Administrador',
        intro: 'El administrador controla los accesos, parámetros institucionales y mantenimiento de la información.',
        sections: [
            {
                id: 'admin-alcance',
                icon: 'hgi-shield-01',
                title: 'Responsabilidades del administrador',
                lead: 'Tu cuenta incluye todas las funciones del asesor y herramientas institucionales adicionales.',
                image: 'manual-assets/manual-admin.png',
                steps: [
                    ['Supervisa los accesos', 'Crea cuentas individuales y asigna el rol correcto.'],
                    ['Configura la entidad', 'Mantén actualizadas tasas, seguros, moneda y tipo de cambio.'],
                    ['Protege la información', 'Realiza mantenimiento únicamente con autorización y evidencia previa.']
                ],
                warning: 'Las operaciones administrativas pueden afectar a todos los usuarios. Verifica el alcance antes de confirmar.'
            },
            {
                id: 'usuarios',
                icon: 'hgi-user-add-01',
                title: 'Administrar usuarios',
                lead: 'Crea accesos trazables para asesores y otros administradores.',
                image: 'manual-assets/manual-admin.png',
                steps: [
                    ['Abre Admin', 'Accede a Gestión de Usuarios desde el menú lateral.'],
                    ['Completa la cuenta', 'Registra nombre, usuario, contraseña segura y rol.'],
                    ['Aplica mínimo privilegio', 'Selecciona Asesor salvo que la persona necesite modificar parámetros o usuarios.'],
                    ['Revoca accesos', 'Elimina cuentas que ya no deben ingresar al sistema.']
                ],
                tip: 'Asigna una cuenta por persona. Evita usuarios compartidos para conservar trazabilidad.'
            },
            {
                id: 'configuracion',
                icon: 'hgi-settings-01',
                title: 'Configurar la entidad',
                lead: 'Los valores institucionales se precargan en cada nueva simulación.',
                image: 'manual-assets/manual-configuracion.png',
                steps: [
                    ['Identificación', 'Actualiza el nombre de la entidad financiera.'],
                    ['Tasa referencial', 'Define TEA o TNA; para TNA selecciona también la capitalización.'],
                    ['Seguros', 'Registra desgravamen sobre saldo y seguro vehicular sobre el precio.'],
                    ['Plazos de gracia', 'Establece el máximo de periodos de gracia que la entidad autoriza otorgar al inicio de cada operación.'],
                    ['Moneda y tipo de cambio', 'Establece la moneda predeterminada y el tipo de cambio contractual.']
                ],
                warning: 'Documenta la fuente y fecha de cada tasa. Un cambio afecta las simulaciones creadas posteriormente.'
            },
            {
                id: 'mantenimiento',
                icon: 'hgi-database-restore',
                title: 'Mantenimiento de datos',
                lead: 'Utiliza las acciones de limpieza solo para correcciones controladas.',
                steps: [
                    ['Identifica el conjunto', 'Diferencia clientes, vehículos y simulaciones antes de limpiar.'],
                    ['Respalda la evidencia', 'Exporta la información necesaria o registra el motivo de la intervención.'],
                    ['Confirma el alcance', '“Restablecer TODO” elimina todos los registros operativos.'],
                    ['Comunica la intervención', 'Informa a los asesores cuando finalice el mantenimiento.']
                ],
                warning: 'Una eliminación puede ser irreversible. No utilices estas opciones durante una atención activa.'
            },
            {
                id: 'seguridad',
                icon: 'hgi-security-check',
                title: 'Seguridad y buenas prácticas',
                lead: 'Reduce riesgos operativos con controles sencillos y consistentes.',
                faq: [
                    ['Contraseñas', 'Exige al menos ocho caracteres, mayúscula, minúscula, número y símbolo.'],
                    ['Roles', 'Revisa periódicamente quién conserva permisos de administrador.'],
                    ['Sesiones', 'Cierra sesión al terminar y no dejes el equipo sin supervisión.'],
                    ['Datos personales', 'Trata la información solo para la finalidad autorizada por el cliente.'],
                    ['Incidentes', 'Registra qué ocurrió, usuario, fecha, información afectada y acción correctiva.']
                ]
            },
            {
                id: 'asesor-incluido',
                icon: 'hgi-book-open-01',
                title: 'Operación del asesor',
                lead: 'El administrador también debe conocer el flujo operativo que brinda soporte.',
                steps: [
                    ['Clientes y vehículos', 'Consulta el Manual del Asesor para altas, búsquedas y ediciones.'],
                    ['Simulaciones', 'Revisa la configuración del crédito, fórmulas e indicadores mostrados.'],
                    ['Historial y PDF', 'Conoce cómo se guardan, consultan y entregan las cotizaciones.']
                ],
                tip: 'Usa el selector superior para abrir el Manual del Asesor sin abandonar esta página.'
            }
        ]
    }
};

let activeManual = 'asesor';
const currentUser = JSON.parse(sessionStorage.getItem('activeUser') || 'null');

function renderManual(type) {
    const manual = HELP_MANUALS[type];
    activeManual = type;

    document.querySelectorAll('[data-manual]').forEach(button => {
        button.classList.toggle('active', button.dataset.manual === type);
        button.setAttribute('aria-selected', button.dataset.manual === type ? 'true' : 'false');
    });

    document.getElementById('help-index-nav').innerHTML = manual.sections
        .map(section => `<a href="#${section.id}"><span>${section.title}</span></a>`)
        .join('');

    document.getElementById('help-content').innerHTML = `
        <div class="manual-heading">
            <div>
                <span class="manual-kicker">Guía operativa institucional</span>
                <h2>Manual del ${manual.label}</h2>
                <p>${manual.intro}</p>
            </div>
            <span class="manual-version">Versión 1.0</span>
        </div>
        ${manual.sections.map((section, index) => renderSection(section, index)).join('')}
    `;

    initScrollSpy();
}

// Scrollspy: resalta en el índice la sección que se está viendo y hace scroll suave al hacer clic.
let spyCleanup = null;
function initScrollSpy() {
    if (spyCleanup) spyCleanup();                 // limpia el listener del manual anterior (evita apilarlos)

    const items = [...document.querySelectorAll('#help-index-nav a')]
        .map(link => ({ link, el: document.getElementById(link.getAttribute('href').slice(1)) }))
        .filter(item => item.el);
    if (!items.length) { spyCleanup = null; return; }

    const OFFSET = 120;                            // toolbar sticky + margen de lectura
    const setActive = () => {
        let idx = 0;
        for (let i = 0; i < items.length; i++) {
            if (items[i].el.getBoundingClientRect().top <= OFFSET) idx = i;
            else break;
        }
        // Al llegar al fondo, marca la última sección aunque su tope no cruce la línea
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            idx = items.length - 1;
        }
        items.forEach((item, i) => item.link.classList.toggle('active', i === idx));
    };

    const onClick = (e) => {
        const item = items.find(it => it.link === e.currentTarget);
        if (!item) return;
        e.preventDefault();
        item.el.scrollIntoView({ behavior: 'smooth', block: 'start' });   // respeta scroll-margin-top
    };
    items.forEach(item => item.link.addEventListener('click', onClick));

    setActive();
    window.addEventListener('scroll', setActive, { passive: true });
    window.addEventListener('resize', setActive, { passive: true });
    spyCleanup = () => {
        window.removeEventListener('scroll', setActive);
        window.removeEventListener('resize', setActive);
        items.forEach(item => item.link.removeEventListener('click', onClick));
    };
}

function renderSection(section, index) {
    const steps = section.steps ? `
        <div class="manual-steps">
            ${section.steps.map((step, stepIndex) => `
                <div class="manual-step">
                    <span class="manual-step-number">${stepIndex + 1}</span>
                    <div><strong>${step[0]}</strong><p>${step[1]}</p></div>
                </div>
            `).join('')}
        </div>` : '';

    const faq = section.faq ? `
        <div class="manual-faq">
            ${section.faq.map(item => `
                <details>
                    <summary>${item[0]}<i class="hgi-stroke hgi-arrow-down-01"></i></summary>
                    <p>${item[1]}</p>
                </details>
            `).join('')}
        </div>` : '';

    const image = section.image ? `
        <figure class="manual-shot">
            <div class="manual-shot-bar"><span></span><span></span><span></span><small>Crédito Vehicular</small></div>
            <img src="${section.image}" alt="Captura del sistema: ${section.title}" loading="lazy">
            <figcaption>Pantalla de referencia · ${section.title}</figcaption>
        </figure>` : '';

    return `
        <article class="manual-section" id="${section.id}">
            <div class="manual-section-title">
                <span>${String(index + 1).padStart(2, '0')}</span>
                <div><h3>${section.title}</h3><p>${section.lead}</p></div>
            </div>
            ${image}
            ${steps}
            ${faq}
            ${section.tip ? `<div class="manual-callout tip"><i class="hgi-stroke hgi-bulb"></i><div><strong>Consejo</strong><p>${section.tip}</p></div></div>` : ''}
            ${section.warning ? `<div class="manual-callout warning"><i class="hgi-stroke hgi-alert-02"></i><div><strong>Importante</strong><p>${section.warning}</p></div></div>` : ''}
        </article>`;
}

function addWrappedText(doc, text, x, y, width, options = {}) {
    doc.setFont(options.font || 'helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(options.size || 10);
    doc.setTextColor(...(options.color || [71, 85, 105]));
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, x, y);
    return y + lines.length * (options.lineHeight || 5);
}

// Convierte a JPEG con downscale: jsPDF procesa JPEG mucho más rápido que PNG y el archivo pesa ~90% menos,
// que era la causa de la demora/bloqueo al generar el manual.
async function imageToDataUrl(path, maxWidth = 1100, quality = 0.82) {
    return new Promise(resolve => {
        const image = new Image();
        image.onload = () => {
            const scale = Math.min(1, maxWidth / image.naturalWidth);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(image.naturalWidth * scale);
            canvas.height = Math.round(image.naturalHeight * scale);
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.onerror = () => resolve(null);
        image.src = path;
    });
}

async function downloadManual() {
    const button = document.getElementById('download-manual');
    button.disabled = true;
    button.classList.add('loading');
    button.querySelector('span').textContent = 'Preparando PDF…';
    // Cede el hilo para que el spinner/estado de carga se pinte antes del trabajo pesado
    await new Promise(resolve => setTimeout(resolve, 30));

    try {
        const manual = HELP_MANUALS[activeManual];
        const { jsPDF } = window.jspdf;

        // Precarga todas las imágenes en paralelo (antes se cargaban una por una dentro del loop → lento)
        const imageCache = {};
        await Promise.all(
            [...new Set(manual.sections.filter(s => s.image).map(s => s.image))]
                .map(async path => { imageCache[path] = await imageToDataUrl(path); })
        );
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 18;
        let y = 0;

        doc.setFillColor(190, 24, 58);
        doc.rect(0, 0, pageWidth, 70, 'F');
        doc.setFillColor(255, 241, 244);
        doc.circle(pageWidth - 18, 18, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('SISTEMA DE CRÉDITO VEHICULAR', margin, 22);
        doc.setFontSize(28);
        doc.text(`Manual del ${manual.label}`, margin, 40);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Guía operativa institucional · Compra Inteligente', margin, 51);
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(10);
        doc.text('Versión 1.0', margin, 84);
        y = addWrappedText(doc, manual.intro, margin, 96, pageWidth - margin * 2, { size: 12, lineHeight: 6 });
        doc.setDrawColor(240, 210, 217);
        doc.line(margin, y + 6, pageWidth - margin, y + 6);
        y += 18;
        doc.setFont('times', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.text('Contenido', margin, y);
        y += 10;
        manual.sections.forEach((section, index) => {
            doc.setFillColor(255, 237, 241);
            doc.circle(margin + 3, y - 1.5, 3.5, 'F');
            doc.setTextColor(190, 24, 58);
            doc.setFontSize(9);
            doc.text(String(index + 1), margin + 1.8, y);
            doc.setTextColor(71, 85, 105);
            doc.setFontSize(10);
            doc.text(section.title, margin + 10, y);
            y += 8;
        });

        for (let index = 0; index < manual.sections.length; index++) {
            const section = manual.sections[index];
            doc.addPage();
            doc.setFillColor(190, 24, 58);
            doc.rect(0, 0, 5, pageHeight, 'F');
            doc.setTextColor(190, 24, 58);
            doc.setFont('times', 'bold');
            doc.setFontSize(10);
            doc.text(`CAPÍTULO ${String(index + 1).padStart(2, '0')}`, margin, 19);
            doc.setTextColor(31, 41, 55);
            doc.setFontSize(22);
            doc.text(section.title, margin, 31);
            y = addWrappedText(doc, section.lead, margin, 42, pageWidth - margin * 2, { size: 11, lineHeight: 5.5 });

            if (section.image) {
                const imageData = imageCache[section.image];
                if (imageData) {
                    y += 5;
                    const properties = doc.getImageProperties(imageData);
                    const availableWidth = pageWidth - margin * 2 - 4;
                    const imageHeight = availableWidth * properties.height / properties.width;
                    const frameHeight = imageHeight + 4;
                    doc.setDrawColor(234, 216, 220);
                    doc.roundedRect(margin, y, pageWidth - margin * 2, frameHeight, 3, 3, 'S');
                    doc.addImage(imageData, 'JPEG', margin + 2, y + 2, availableWidth, imageHeight, undefined, 'FAST');
                    y += frameHeight + 9;
                }
            }

            if (section.steps) {
                section.steps.forEach((step, stepIndex) => {
                    if (y > pageHeight - 30) { doc.addPage(); y = 20; }
                    doc.setFillColor(190, 24, 58);
                    doc.circle(margin + 4, y + 1, 4, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.text(String(stepIndex + 1), margin + 2.7, y + 2.2);
                    doc.setTextColor(31, 41, 55);
                    doc.setFont('times', 'bold');
                    doc.setFontSize(11);
                    doc.text(step[0], margin + 12, y + 1);
                    y = addWrappedText(doc, step[1], margin + 12, y + 7, pageWidth - margin * 2 - 12, { size: 9.5, lineHeight: 4.5 }) + 6;
                });
            }

            if (section.faq) {
                section.faq.forEach(item => {
                    if (y > pageHeight - 32) { doc.addPage(); y = 20; }
                    doc.setFillColor(250, 246, 247);
                    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 20, 2, 2, 'F');
                    doc.setTextColor(31, 41, 55);
                    doc.setFont('times', 'bold');
                    doc.setFontSize(10);
                    doc.text(item[0], margin + 4, y + 1);
                    addWrappedText(doc, item[1], margin + 4, y + 7, pageWidth - margin * 2 - 8, { size: 8.8, lineHeight: 4 });
                    y += 25;
                });
            }

            const callout = section.warning || section.tip;
            if (callout && y < pageHeight - 35) {
                doc.setFillColor(section.warning ? 255 : 245, section.warning ? 247 : 250, section.warning ? 237 : 247);
                doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 3, 3, 'F');
                doc.setTextColor(section.warning ? 180 : 22, section.warning ? 83 : 101, section.warning ? 9 : 52);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(section.warning ? 'IMPORTANTE' : 'CONSEJO', margin + 5, y + 7);
                addWrappedText(doc, callout, margin + 5, y + 13, pageWidth - margin * 2 - 10, { size: 8.5, lineHeight: 4, color: [71, 85, 105] });
            }
        }

        const pages = doc.getNumberOfPages();
        for (let page = 1; page <= pages; page++) {
            doc.setPage(page);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Crédito Vehicular · Manual del ${manual.label}`, margin, pageHeight - 9);
            doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
        }

        doc.save(`Manual_${manual.label}_Credito_Vehicular.pdf`);
        notify.ok(`Manual del ${manual.label} descargado correctamente.`);
    } catch (error) {
        console.error(error);
        notify.err('No se pudo generar el manual. Inténtalo nuevamente.');
    } finally {
        button.disabled = false;
        button.classList.remove('loading');
        button.querySelector('span').textContent = 'Descargar manual PDF';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const adminTab = document.getElementById('admin-manual-tab');
    if (!currentUser || currentUser.rol !== 'admin') adminTab.hidden = true;

    document.querySelectorAll('[data-manual]').forEach(button => {
        button.addEventListener('click', () => renderManual(button.dataset.manual));
    });
    document.getElementById('download-manual').addEventListener('click', downloadManual);
    renderManual('asesor');
});
