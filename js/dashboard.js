/**
 * DASHBOARD.JS - Lógica del menú principal
 * Al cargar: comprueba que el usuario esté logueado.
 * El botón "Cerrar Sesión" pregunta confirmación y luego cierra sesión (auth.js).
 */

document.addEventListener('DOMContentLoaded', function() {
    // Si no está logueado, lo redirige a login
    verificarAutenticacion();

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            cerrarSesion();
        }
    });
});

/**
 * Muestra un mensaje temporal en el dashboard (ej: "Facturación en desarrollo").
 * @param {string} texto - Mensaje a mostrar
 */
function mostrarMensaje(texto) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = 'mensaje info';
    mensajeDiv.classList.remove('oculto');

    setTimeout(function() {
        mensajeDiv.classList.add('oculto');
    }, 3000);
}
