/**
 * LOGIN.JS - Lógica de la página de inicio de sesión
 * Cuando la página carga: si ya está logueado, lo manda al dashboard.
 * Cuando envía el formulario: comprueba usuario/contraseña y, si son correctos, guarda sesión y redirige.
 */

// Esperamos a que el HTML esté listo antes de enlazar eventos
document.addEventListener('DOMContentLoaded', function() {
    // Si ya tiene sesión, no mostrar login; ir directo al dashboard
    redirigirSiAutenticado();

    const loginForm = document.getElementById('login-form');

    // Escuchar el envío del formulario (botón "Iniciar Sesión" o Enter)
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Evita que la página se recargue

        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!usuario || !password) {
            mostrarMensajeLogin('Por favor completa todos los campos', 'error');
            return;
        }

        if (iniciarSesion(usuario, password)) {
            mostrarMensajeLogin('Inicio de sesión exitoso. Redirigiendo...', 'exito');
            setTimeout(function() {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            mostrarMensajeLogin('Usuario o contraseña incorrectos', 'error');
            document.getElementById('password').value = '';
        }
    });
});

/**
 * Muestra un mensaje en el cuadro de mensajes del login.
 * @param {string} texto - El mensaje a mostrar
 * @param {string} tipo - 'exito' o 'error' (cambia el estilo del mensaje)
 */
function mostrarMensajeLogin(texto, tipo) {
    const mensajeLogin = document.getElementById('mensaje-login');
    mensajeLogin.textContent = texto;
    mensajeLogin.className = 'mensaje ' + tipo;
    mensajeLogin.classList.remove('oculto');

    // Ocultar el mensaje después de 5 segundos
    setTimeout(function() {
        mensajeLogin.classList.add('oculto');
    }, 5000);
}
