/**
 * DASHBOARD.JS - Lógica del menú principal
 * Al cargar: comprueba que el usuario esté logueado y controla acceso a CRUD por rol.
 * El botón "Cerrar Sesión" pregunta confirmación y luego cierra sesión (auth.js).
 */

import { supabase } from './config.js';
import { verificarAutenticacion, cerrarSesion, esAdmin, obtenerPerfilUsuario } from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Si no está logueado, lo redirige a login
    await verificarAutenticacion();

    // Controlar visibilidad de CRUD según rol
    await controlarAccesoCRUD();

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            cerrarSesion();
        }
    });
});

/**
 * Verifica si el usuario es admin y controla la visibilidad del botón CRUD.
 */
async function controlarAccesoCRUD() {
    try {
        const admin = await esAdmin();
        const btnCRUD = document.querySelector('button[onclick="window.location.href=\'crud.html\'"]');
        
        if (btnCRUD) {
            if (!admin) {
                // Si no es admin, ocultar el botón CRUD
                btnCRUD.parentElement.style.display = 'none';
                console.log('Acceso a CRUD bloqueado para propietario');
            }
        }
    } catch (error) {
        console.error('Error al controlar acceso CRUD:', error);
    }
}

/**
 * Muestra un mensaje temporal en el dashboard (ej: "Facturación en desarrollo").
 * @param {string} texto - Mensaje a mostrar
 */
function mostrarMensaje(texto) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = 'alert alert-info';
    mensajeDiv.classList.remove('oculto');

    setTimeout(function() {
        mensajeDiv.classList.add('oculto');
    }, 3000);
}
