// Lógica de la página de login

document.addEventListener('DOMContentLoaded', function() {
    // Si ya está autenticado, redirigir al dashboard
    redirigirSiAutenticado();
    
    const loginForm = document.getElementById('login-form');
    const mensajeLogin = document.getElementById('mensaje-login');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!usuario || !password) {
            mostrarMensajeLogin('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (iniciarSesion(usuario, password)) {
            mostrarMensajeLogin('Inicio de sesión exitoso. Redirigiendo...', 'exito');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            mostrarMensajeLogin('Usuario o contraseña incorrectos', 'error');
            document.getElementById('password').value = '';
        }
    });
});

/**
 * Mostrar mensaje en el login
 */
function mostrarMensajeLogin(texto, tipo) {
    const mensajeLogin = document.getElementById('mensaje-login');
    mensajeLogin.textContent = texto;
    mensajeLogin.className = `mensaje ${tipo}`;
    mensajeLogin.classList.remove('oculto');
    
    setTimeout(() => {
        mensajeLogin.classList.add('oculto');
    }, 5000);
}

