/**
 * AUTH.JS - Autenticación simple con localStorage
 * No hay servidor de login: comprobamos usuario y contraseña aquí mismo.
 * El "estado de sesión" se guarda en el navegador (localStorage).
 */

// Usuario y contraseña permitidos (en un proyecto real esto estaría en un servidor)
const CREDENTIALS = {
    usuario: 'admin',
    password: '12345'
};

// Clave con la que guardamos en localStorage si el usuario está logueado o no
const SESSION_KEY = 'propiedad_horizontal_session';

/**
 * Indica si el usuario está logueado.
 * Lee localStorage: si tiene guardado 'true' en SESSION_KEY, está autenticado.
 * @returns {boolean}
 */
function estaAutenticado() {
    const session = localStorage.getItem(SESSION_KEY);
    return session === 'true';
}

/**
 * Intenta iniciar sesión. Si usuario y contraseña coinciden, guarda la sesión y devuelve true.
 * @param {string} usuario
 * @param {string} password
 * @returns {boolean}
 */
function iniciarSesion(usuario, password) {
    if (usuario === CREDENTIALS.usuario && password === CREDENTIALS.password) {
        localStorage.setItem(SESSION_KEY, 'true');
        return true;
    }
    return false;
}

/**
 * Cierra la sesión: borra la clave del localStorage y redirige a login.html.
 */
function cerrarSesion() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

/**
 * Si el usuario NO está autenticado, lo manda a login.html.
 * Se llama en dashboard y crud. Si SÍ está logueado no hace nada (evita bucle de recargas).
 */
function verificarAutenticacion() {
    if (!estaAutenticado()) {
        window.location.href = 'login.html';
    }
}

/**
 * Si el usuario YA está autenticado, lo manda al dashboard.
 * Se llama en login.html para no mostrar el formulario si ya inició sesión.
 */
function redirigirSiAutenticado() {
    if (estaAutenticado()) {
        window.location.href = 'dashboard.html';
    }
}
