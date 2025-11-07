// Sistema de autenticación simple usando localStorage

const CREDENTIALS = {
    usuario: 'admin',
    password: '12345'
};

const SESSION_KEY = 'propiedad_horizontal_session';

/**
 * Verificar si el usuario está autenticado
 */
function estaAutenticado() {
    const session = localStorage.getItem(SESSION_KEY);
    return session === 'true';
}

/**
 * Iniciar sesión
 */
function iniciarSesion(usuario, password) {
    if (usuario === CREDENTIALS.usuario && password === CREDENTIALS.password) {
        localStorage.setItem(SESSION_KEY, 'true');
        return true;
    }
    return false;
}

/**
 * Cerrar sesión
 */
function cerrarSesion() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

/**
 * Verificar autenticación y redirigir si es necesario
 */
function verificarAutenticacion() {
    if (!estaAutenticado()) {
        window.location.href = 'login.html';
    }
}

/**
 * Redirigir al dashboard si ya está autenticado
 */
function redirigirSiAutenticado() {
    if (estaAutenticado()) {
        window.location.href = 'dashboard.html';
    }
}

