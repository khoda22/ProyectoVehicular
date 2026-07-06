if (window.toast) {
    toast.defaults.position = 'top-center';
}

// Respaldo a alert() si Physics-Toast no cargó
window.notify = {
    ok:   (msg, title = 'Listo')      => window.toast ? toast.success(title, msg) : alert(msg),
    err:  (msg, title = 'Atención')   => window.toast ? toast.error(title, msg)   : alert(msg),
    info: (msg, title = 'Información') => window.toast ? toast.info(title, msg)    : alert(msg)
};
