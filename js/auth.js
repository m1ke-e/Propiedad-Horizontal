/**
 * AUTH.JS - Autenticación con Supabase Auth
 * Maneja sesiones seguras usando Supabase Auth.
 * Los usuarios se crean en Supabase Auth y sus perfiles en la tabla Usuarios.
 */

import { supabase } from './config.js';

// UID del administrador (único admin del sistema)
const ADMIN_UID = '640c2962-0efc-447a-b236-2565ef6b52cb';

/**
 * Obtiene el usuario autenticado actualmente.
 * @returns {Promise<Object|null>} El usuario autenticado o null
 */
async function obtenerUsuarioActual() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        return null;
    }
}

/**
 * Obtiene el perfil del usuario autenticado desde la tabla Usuarios.
 * @returns {Promise<Object|null>} El perfil del usuario o null
 */
async function obtenerPerfilUsuario() {
    try {
        const user = await obtenerUsuarioActual();
        if (!user) return null;

        const { data: perfil, error } = await supabase
            .from('Usuarios')
            .select('*')
            .eq('AUTH_ID', user.id)
            .single();

        if (error) {
            console.error('Error al obtener perfil:', error);
            return null;
        }
        return perfil;
    } catch (error) {
        console.error('Error en obtenerPerfilUsuario:', error);
        return null;
    }
}

/**
 * Obtiene el tipo de usuario (1 = admin, 0 = propietario).
 * @returns {Promise<number|null>} El tipo de usuario o null
 */
async function obtenerTipoUsuario() {
    const perfil = await obtenerPerfilUsuario();
    return perfil ? perfil.TIPO_USUARIO : null;
}

/**
 * Verifica si el usuario es admin.
 * @returns {Promise<boolean>}
 */
async function esAdmin() {
    const user = await obtenerUsuarioActual();
    return user && user.id === ADMIN_UID;
}

/**
 * Indica si hay una sesión activa en Supabase Auth.
 * @returns {Promise<boolean>}
 */
async function estaAutenticado() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session !== null;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        return false;
    }
}

/**
 * Inicia sesión con email y contraseña usando Supabase Auth.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Datos de la sesión
 */
async function iniciarSesion(email, password) {
    try {
        console.log('Iniciando sesión con:', email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Error en signInWithPassword:', error);
            throw new Error(error.message || 'Error al iniciar sesión');
        }

        console.log('Sesión iniciada:', data);
        return data;
    } catch (error) {
        console.error('Error en iniciarSesion:', error);
        throw error;
    }
}

/**
 * Cierra la sesión actual y redirige a login.html.
 */
async function cerrarSesion() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        console.log('Sesión cerrada');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        window.location.href = 'login.html';
    }
}

/**
 * Verifica si el usuario está autenticado; si no, redirige a login.html.
 */
async function verificarAutenticacion() {
    const autenticado = await estaAutenticado();
    if (!autenticado) {
        window.location.href = 'login.html';
    }
}

/**
 * Si el usuario ya está autenticado, redirige a dashboard.html.
 */
async function redirigirSiAutenticado() {
    const autenticado = await estaAutenticado();
    if (autenticado) {
        window.location.href = 'dashboard.html';
    }
}

export {
    obtenerPerfilUsuario,
    verificarAutenticacion,
    esAdmin,
    estaAutenticado,
    cerrarSesion,
    redirigirSiAutenticado,
    obtenerUsuarioActual,
    iniciarSesion,
    obtenerTipoUsuario
};
