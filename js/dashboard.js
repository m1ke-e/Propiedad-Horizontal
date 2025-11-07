// Lógica de la página dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    verificarAutenticacion();
    
    // Botón de cerrar sesión
    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            cerrarSesion();
        }
    });
});

/**
 * Mostrar mensaje en el dashboard
 */
function mostrarMensaje(texto) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = 'mensaje info';
    mensajeDiv.classList.remove('oculto');
    
    setTimeout(() => {
        mensajeDiv.classList.add('oculto');
    }, 3000);
}

