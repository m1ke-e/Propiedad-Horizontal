/**
 * LOGIN.JS - Lógica de la página de inicio de sesión
 * Cuando la página carga: si ya está logueado, lo manda al dashboard.
 * Cuando envía el formulario: autentica con Supabase Auth y redirige.
 */

import { supabase } from './config.js';

// Esperamos a que el HTML esté listo antes de enlazar eventos
document.addEventListener('DOMContentLoaded', function() {
    // Si ya tiene sesión, no mostrar login; ir directo al dashboard
    redirigirSiAutenticado();

    const loginForm = document.getElementById('login-form');
    const registroForm = document.getElementById('registro-form');

    // Escuchar el envío del formulario de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            mostrarMensajeLogin('Por favor completa todos los campos', 'error', 'login');
            return;
        }

        realizarLogin(email, password);
    });

    // Escuchar el envío del formulario de registro
    registroForm.addEventListener('submit', function(e) {
        e.preventDefault();
        realizarRegistro();
    });

    // Enlaces para recuperación de contraseña
    const forgotLink = document.getElementById('forgot-password-link');
    const resetSection = document.getElementById('reset-password-section');
    const btnReset = document.getElementById('btn-reset-password');
    const btnCancelReset = document.getElementById('btn-cancel-reset');

    forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-pane').style.display = 'none';
        document.getElementById('registro-pane').style.display = 'none';
        resetSection.style.display = 'block';
    });

    btnCancelReset.addEventListener('click', function() {
        resetSection.style.display = 'none';
        document.getElementById('login-pane').style.display = 'block';
        document.getElementById('registro-pane').style.display = 'none';
        // Activar la tab de login
        const loginTab = document.getElementById('login-tab');
        loginTab.click();
    });

    btnReset.addEventListener('click', function() {
        const email = document.getElementById('reset-email').value.trim();
        if (!email || !validarEmail(email)) {
            mostrarMensajeLogin('Ingresa un email válido', 'error', 'reset');
            return;
        }
        enviarResetPassword(email);
    });
});

/**
 * Realiza el login con email y contraseña usando Supabase Auth.
 * @param {string} email
 * @param {string} password
 */
async function realizarLogin(email, password) {
    try {
        mostrarMensajeLogin('Verificando credenciales...', 'info');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Error en login:', error);
            mostrarMensajeLogin('Email o contraseña incorrectos', 'error');
            document.getElementById('password').value = '';
            return;
        }

        console.log('Login exitoso:', data);
        mostrarMensajeLogin('Inicio de sesión exitoso. Redirigiendo...', 'exito');
        
        // Redirigir al dashboard después de 1 segundo
        setTimeout(function() {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        console.error('Error inesperado en login:', error);
        mostrarMensajeLogin('Error al iniciar sesión: ' + error.message, 'error');
        document.getElementById('password').value = '';
    }
}

/**
 * Si el usuario YA está autenticado, lo manda al dashboard.
 */
async function redirigirSiAutenticado() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
    }
}

/**
 * Realiza el registro: crea usuario en Auth y perfil en Usuarios como propietario.
 */
async function realizarRegistro() {
    try {
        const formData = new FormData(document.getElementById('registro-form'));
        const nombre = formData.get('nombre').trim();
        const cedula = parseInt(formData.get('cedula'));
        const email = formData.get('email').trim();
        const celular = formData.get('celular').trim();
        const password = formData.get('password').trim();
        const passwordConfirm = formData.get('password-confirm').trim();

        if (password !== passwordConfirm) {
            mostrarMensajeLogin('Las contraseñas no coinciden', 'error', 'registro');
            return;
        }
        if (!nombre || nombre.length < 3) {
            mostrarMensajeLogin('El nombre debe tener al menos 3 caracteres', 'error', 'registro');
            return;
        }
        if (!cedula || cedula < 1) {
            mostrarMensajeLogin('La cédula debe ser válida', 'error', 'registro');
            return;
        }
        if (!email || !validarEmail(email)) {
            mostrarMensajeLogin('Ingresa un email válido', 'error', 'registro');
            return;
        }
        if (password.length < 6) {
            mostrarMensajeLogin('La contraseña debe tener al menos 6 caracteres', 'error', 'registro');
            return;
        }

        if (!validarContraseña(password)) {
            mostrarMensajeLogin('La contraseña debe incluir mayúscula, minúscula, número y símbolo', 'error', 'registro');
            return;
        }

        mostrarMensajeLogin('Creando cuenta...', 'info', 'registro');

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) {
            console.error('Error al crear usuario en Auth:', authError);
            mostrarMensajeLogin('Error: ' + authError.message, 'error', 'registro');
            return;
        }

        const { data: perfilData, error: perfilError } = await supabase
            .from('Usuarios')
            .insert([{ 
                CEDULA: cedula,
                NOMBRE: nombre,
                CORREO: email,
                CELULAR: celular,
                ESTADO: 1,
                TIPO_USUARIO: 0,
                AUTH_ID: authData.user.id
            }])
            .select();

        if (perfilError) {
            console.error('Error al crear perfil:', perfilError);
            mostrarMensajeLogin('Cuenta creada pero error al guardar perfil: ' + perfilError.message, 'error', 'registro');
            return;
        }

        console.log('Perfil creado:', perfilData);
        mostrarMensajeLogin('¡Cuenta creada exitosamente! Iniciando sesión...', 'exito', 'registro');
        setTimeout(function() {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        console.error('Error inesperado en registro:', error);
        mostrarMensajeLogin('Error: ' + error.message, 'error', 'registro');
    }
}

/**
 * Envía un enlace de recuperación de contraseña por email.
 * @param {string} email
 */
async function enviarResetPassword(email) {
    try {
        mostrarMensajeLogin('Enviando enlace de recuperación...', 'info', 'reset');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/login.html'
        });

        if (error) {
            console.error('Error al enviar reset:', error);
            mostrarMensajeLogin('Error: ' + error.message, 'error', 'reset');
            return;
        }

        mostrarMensajeLogin('Enlace de recuperación enviado a tu email', 'exito', 'reset');
        setTimeout(function() {
            document.getElementById('btn-cancel-reset').click();
        }, 3000);
    } catch (error) {
        console.error('Error inesperado en reset:', error);
        mostrarMensajeLogin('Error: ' + error.message, 'error', 'reset');
    }
}

function mostrarMensajeLogin(texto, tipo, formulario = 'login') {
    let mensajeId;
    if (formulario === 'login') mensajeId = 'mensaje-login';
    else if (formulario === 'registro') mensajeId = 'mensaje-registro';
    else if (formulario === 'reset') mensajeId = 'mensaje-reset';
    const mensajeLogin = document.getElementById(mensajeId);
    mensajeLogin.textContent = texto;
    var alertClass = 'alert ';
    switch(tipo) {
        case 'exito':
            alertClass += 'alert-success';
            break;
        case 'error':
            alertClass += 'alert-danger';
            break;
        case 'info':
        default:
            alertClass += 'alert-info';
            break;
    }
    mensajeLogin.className = alertClass;
    mensajeLogin.classList.remove('oculto');

    if (tipo !== 'info') {
        setTimeout(function() {
            mensajeLogin.classList.add('oculto');
        }, 5000);
    }
}

function validarEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarContraseña(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return regex.test(password);
}
