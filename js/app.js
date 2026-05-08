/**
 * APP.JS - CRUD de usuarios (Crear, Leer, Actualizar, Eliminar)
 * Usa el SDK de Supabase. La lista se guarda en usuariosCache
 * para no pedirla otra vez al servidor cuando buscas o editas.
 * Integra Supabase Auth para el registro de propietarios.
 */

import { supabase, SUPABASE_TABLE } from './config.js';

// ¿Estamos editando un usuario existente o creando uno nuevo?
var modoEdicion = false;
// ID del registro en Supabase que estamos editando (solo tiene valor en modo edición)
var documentoIdActual = null;
// Copia en memoria de todos los usuarios (para búsqueda y para cargar al editar)
var usuariosCache = [];

// Cuando el HTML está listo, inicializamos los eventos y cargamos la lista
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

/**
 * Enlaza los botones y el formulario a sus funciones y carga la lista de propietarios.
 */
function inicializarApp() {
    var formulario = document.getElementById('form-propietario');
    var btnCancelar = document.getElementById('btn-cancelar');
    var btnBuscar = document.getElementById('btn-buscar');
    var btnLimpiar = document.getElementById('btn-limpiar');
    var inputBusqueda = document.getElementById('busqueda');

    formulario.addEventListener('submit', manejarSubmit);
    btnCancelar.addEventListener('click', cancelarEdicion);
    btnBuscar.addEventListener('click', realizarBusqueda);
    btnLimpiar.addEventListener('click', limpiarBusqueda);

    // Al pulsar Enter en el campo de búsqueda, se ejecuta la búsqueda
    inputBusqueda.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            realizarBusqueda();
        }
    });

    obtenerPropietarios();
}

/**
 * Genera un UUID para el campo USU_CODIGO si no lo crea la base de datos.
 * @returns {string}
 */
function generarUUID() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// --- CRUD (operaciones con Supabase) ---

/**
 * CREATE: Crea un nuevo usuario en Supabase Auth y su perfil en la tabla Usuarios.
 * @param {Object} datos - Objeto con campos según la tabla Usuarios
 * @param {string} password - Contraseña para el usuario Auth
 */
async function crearPropietario(datos, password) {
    try {
        console.log('Iniciando creación de propietario');

        // 1. Crear el usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: datos.CORREO,
            password: password
        });

        if (authError) {
            console.error('Error al crear usuario en Auth:', authError);
            throw new Error(authError.message || 'Error al crear usuario en autenticación');
        }

        console.log('Usuario Auth creado:', authData.user.id);

        // 2. Crear el perfil en la tabla Usuarios
        const datosConAuth = {
            ...datos,
            AUTH_ID: authData.user.id,
            TIPO_USUARIO: 0  // 0 = propietario, 1 = admin
        };

        const { data: perfilData, error: perfilError } = await supabase
            .from(SUPABASE_TABLE)
            .insert([datosConAuth])
            .select();

        if (perfilError) {
            console.error('Error al crear perfil:', perfilError);
            throw new Error(perfilError.message || 'Error al crear perfil de usuario');
        }

        console.log('Perfil creado:', perfilData);
        mostrarMensaje('Usuario propietario creado exitosamente', 'exito');
        return perfilData;
    } catch (error) {
        console.error('Error al crear propietario:', error);
        mostrarMensaje('Error al crear usuario: ' + error.message, 'error');
        throw error;
    }
}

/**
 * READ: Obtiene todos los usuarios de Supabase, los guarda en usuariosCache y pinta la tabla.
 */
async function obtenerPropietarios() {
    try {
        console.log('Fetching all users');
        
        const { data: usuarios, error } = await supabase
            .from(SUPABASE_TABLE)
            .select('*');

        if (error) {
            console.error('Select error:', error);
            throw new Error(error.message || 'Error al obtener usuarios');
        }

        console.log('Fetched users:', usuarios);
        usuariosCache = usuarios || [];
        renderizarTabla(usuariosCache);
        return usuariosCache;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        mostrarMensaje('Error al cargar usuarios: ' + error.message, 'error');
        renderizarTabla([]);
        return [];
    }
}

/**
 * READ (uno): Busca un usuario por cédula. Primero carga todos y luego filtra.
 * @param {string} cedula
 * @returns {Object} El usuario encontrado
 */
async function obtenerPropietarioPorCedula(cedula) {
    var usuarios = await obtenerPropietarios();
    var usuario = null;
    var cedulaNum = parseInt(cedula);
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].CEDULA === cedulaNum) {
            usuario = usuarios[i];
            break;
        }
    }
    if (!usuario) {
        throw new Error('Usuario no encontrado');
    }
    return usuario;
}

/**
 * UPDATE: Actualiza un registro existente en Supabase.
 * @param {string} documentId - ID del registro en Supabase
 * @param {Object} datos - Campos a actualizar
 */
async function actualizarPropietario(documentId, datos) {
    try {
        console.log('Updating user:', documentId, datos);
        
        const { data, error } = await supabase
            .from(SUPABASE_TABLE)
            .update(datos)
            .eq('USU_CODIGO', documentId)
            .select();

        if (error) {
            console.error('Update error:', error);
            throw new Error(error.message || 'Error al actualizar usuario');
        }

        console.log('Updated user:', data);
        mostrarMensaje('Usuario actualizado exitosamente', 'exito');
        return data;
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        mostrarMensaje('Error al actualizar usuario: ' + error.message, 'error');
        throw error;
    }
}

/**
 * DELETE: Elimina un registro de Supabase.
 * @param {string} documentId - ID del registro a eliminar
 */
async function eliminarPropietario(documentId) {
    try {
        console.log('Deleting user:', documentId);
        
        const { error } = await supabase
            .from(SUPABASE_TABLE)
            .delete()
            .eq('USU_CODIGO', documentId);

        if (error) {
            console.error('Delete error:', error);
            throw new Error(error.message || 'Error al eliminar usuario');
        }

        console.log('Deleted user successfully');
        mostrarMensaje('Usuario eliminado exitosamente', 'exito');
        return true;
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        mostrarMensaje('Error al eliminar usuario: ' + error.message, 'error');
        throw error;
    }
}

// --- Interfaz (tabla y formulario) ---

/**
 * Borra el contenido del tbody y escribe una fila por cada usuario (o un mensaje si no hay ninguno).
 * @param {Array} usuarios - Lista de objetos usuario a mostrar
 */
function renderizarTabla(usuarios) {
    var tbody = document.getElementById('tabla-body');

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay usuarios registrados</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < usuarios.length; i++) {
        var p = usuarios[i];
        html += '<tr>';
        html += '<td>' + escapeHtml(p.NOMBRE || '') + '</td>';
        html += '<td>' + escapeHtml(p.CEDULA || '') + '</td>';
        html += '<td>' + (p.ESTADO === 1 ? 'Activo' : 'Inactivo') + '</td>';
        html += '<td>' + escapeHtml(p.CELULAR || '') + '</td>';
        html += '<td>' + escapeHtml(p.CORREO || '') + '</td>';
        html += '<td>' + formatearFecha(p.FECHA_CREACION) + '</td>';
        html += '<td>' + formatearFecha(p.FECHA_MODIFICACION) + '</td>';
        html += '<td class="acciones-cell d-flex gap-2 justify-content-center flex-wrap">';
        html += '<button class="btn btn-outline-primary btn-sm" onclick="editarPropietario(\'' + p.USU_CODIGO + '\', \'' + escapeHtml(String(p.CEDULA || '')) + '\')">Editar</button> ';
        html += '<button class="btn btn-outline-danger btn-sm" onclick="confirmarEliminar(\'' + p.USU_CODIGO + '\', \'' + escapeHtml(p.NOMBRE || '') + '\')">Eliminar</button>';
        html += '</td></tr>';
    }
    tbody.innerHTML = html;
}

/**
 * Se ejecuta al enviar el formulario (Guardar o Actualizar).
 * Lee los valores del formulario, valida y llama a crearPropietario o actualizarPropietario.
 * @param {Event} e - Evento submit del formulario
 */
async function manejarSubmit(e) {
    e.preventDefault();

    var formData = new FormData(e.target);
    var datos = {
        CEDULA: parseInt(formData.get('cedula')) || 0,
        NOMBRE: formData.get('nombre').trim(),
        CORREO: formData.get('correo').trim(),
        CELULAR: parseInt(formData.get('celular')) || 0,
        ESTADO: formData.get('estado') === 'Activo' ? 1 : 0
    };
    
    var password = formData.get('password') ? formData.get('password').trim() : '';

    if (!modoEdicion) {
        datos.USU_CODIGO = generarUUID();
    }

    if (!validarDatos(datos, !modoEdicion)) {
        return;
    }

    try {
        if (modoEdicion) {
            await actualizarPropietario(documentoIdActual, datos);
        } else {
            // En modo crear, se requiere contraseña y se crea usuario en Auth
            if (!password || password.length < 6) {
                mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            await crearPropietario(datos, password);
        }
        limpiarFormulario();
        await obtenerPropietarios();
    } catch (err) {
        // El mensaje de error ya se mostró en crear/actualizar
    }
}

/**
 * Carga los datos de un propietario en el formulario y pone la página en "modo edición".
 * Así el usuario puede modificar y al guardar se hace PATCH en vez de POST.
 * @param {string} documentId - ID del registro en Supabase
 * @param {string} cedula - Cédula (por si hay que cargar el propietario desde el servidor)
 */
async function editarPropietario(documentId, cedula) {
    try {
        var usuario = null;
        for (var i = 0; i < usuariosCache.length; i++) {
            if (usuariosCache[i].USU_CODIGO === documentId) {
                usuario = usuariosCache[i];
                break;
            }
        }
        if (!usuario) {
            usuario = await obtenerPropietarioPorCedula(cedula);
        }

        document.getElementById('nombre').value = usuario.NOMBRE || '';
        document.getElementById('cedula').value = usuario.CEDULA || '';
        document.getElementById('correo').value = usuario.CORREO || '';
        document.getElementById('celular').value = usuario.CELULAR || '';
        document.getElementById('estado').value = usuario.ESTADO === 1 ? 'Activo' : 'Inactivo';
        document.getElementById('password').value = '';

        modoEdicion = true;
        documentoIdActual = documentId;
        document.getElementById('form-titulo').textContent = 'Editar Usuario';
        document.getElementById('btn-guardar').textContent = 'Actualizar Usuario';
        document.getElementById('btn-cancelar').textContent = 'Cancelar Edición';
        document.getElementById('btn-cancelar').classList.remove('oculto');
        document.getElementById('cedula').readOnly = true;
        
        // En edición, ocultar el campo de contraseña
        document.getElementById('password-container').style.display = 'none';

        document.getElementById('form-propietario').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        mostrarMensaje('Error al cargar datos del usuario: ' + error.message, 'error');
    }
}

/**
 * Sale del modo edición: limpia el formulario, restaura títulos y botones y quita readonly de cédula y apartamento.
 */
function cancelarEdicion() {
    modoEdicion = false;
    documentoIdActual = null;
    document.getElementById('form-propietario').reset();
    document.getElementById('form-titulo').textContent = 'Añadir Nuevo Usuario';
    document.getElementById('btn-guardar').textContent = 'Guardar';
    document.getElementById('btn-cancelar').textContent = 'Cancelar';
    document.getElementById('btn-cancelar').classList.add('oculto');
    document.getElementById('cedula').readOnly = false;
    document.getElementById('password-container').style.display = 'block';
}

/**
 * Pide confirmación y, si el usuario acepta, elimina al usuario y vuelve a cargar la tabla.
 * @param {string} documentId - ID del usuario a eliminar
 * @param {string} nombre - Nombre del usuario (para mostrar en el mensaje de confirmación)
 */
function confirmarEliminar(documentId, nombre) {
    if (confirm('¿Estás seguro de que deseas eliminar a ' + nombre + '?')) {
        eliminarPropietario(documentId).then(function() {
            obtenerPropietarios();
        });
    }
}

/**
 * Limpia el formulario y deja la app en modo "crear nuevo" (no edición).
 */
function limpiarFormulario() {
    document.getElementById('form-propietario').reset();
    modoEdicion = false;
    documentoIdActual = null;
    document.getElementById('form-titulo').textContent = 'Añadir Nuevo Usuario';
    document.getElementById('btn-guardar').textContent = 'Guardar';
    document.getElementById('btn-cancelar').textContent = 'Cancelar';
    document.getElementById('btn-cancelar').classList.add('oculto');
    document.getElementById('cedula').readOnly = false;
    document.getElementById('password-container').style.display = 'block';
}

/**
 * Muestra un mensaje en el div #mensaje y lo oculta a los 5 segundos.
 * @param {string} texto
 * @param {string} tipo - 'exito', 'error' o 'info' (cambia la clase CSS)
 */
function mostrarMensaje(texto, tipo) {
    tipo = tipo || 'info';
    var mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    // Map custom classes to Bootstrap alert classes
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
    mensajeDiv.className = alertClass;
    mensajeDiv.classList.remove('oculto');
    setTimeout(function() {
        mensajeDiv.classList.add('oculto');
    }, 5000);
}

/**
 * Comprueba que nombre, cédula, correo, celular y estado estén bien. Si algo falla, muestra mensaje y devuelve false.
 * @param {Object} datos
 * @param {boolean} esCreacion - Si es creación (requiere más validaciones)
 * @returns {boolean}
 */
function validarDatos(datos, esCreacion = false) {
    if (!datos.NOMBRE || datos.NOMBRE.length < 3) {
        mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
        return false;
    }
    if (!datos.CEDULA || datos.CEDULA < 1) {
        mostrarMensaje('La cédula debe ser un número válido', 'error');
        return false;
    }
    if (!datos.CORREO || !validarEmail(datos.CORREO)) {
        mostrarMensaje('Ingresa un correo válido', 'error');
        return false;
    }
    if (!datos.CELULAR || datos.CELULAR < 1) {
        mostrarMensaje('Ingresa un número de celular válido', 'error');
        return false;
    }
    if (datos.ESTADO === '' || datos.ESTADO === null) {
        mostrarMensaje('Selecciona un estado', 'error');
        return false;
    }
    return true;
}

/**
 * Comprueba si una cadena tiene formato de email (algo@algo.algo).
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Convierte una fecha en formato ISO (ej. 2024-01-15) a formato legible en español (ej. 15/01/2024).
 * @param {string} fecha
 * @returns {string}
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    try {
        var fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        return fecha;
    }
}

/**
 * Escapa caracteres especiales del texto para que no se interprete como HTML (evita problemas de seguridad XSS).
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Filtra usuariosCache por cédula o nombre (según lo que escribió el usuario) y pinta solo esos en la tabla.
 * Muestra el botón "Limpiar" para volver a ver todos.
 */
function realizarBusqueda() {
    var terminoBusqueda = document.getElementById('busqueda').value.trim().toLowerCase();
    var btnLimpiar = document.getElementById('btn-limpiar');

    if (!terminoBusqueda) {
        mostrarMensaje('Ingresa un término de búsqueda', 'info');
        return;
    }

    var resultados = [];
    for (var i = 0; i < usuariosCache.length; i++) {
        var p = usuariosCache[i];
        // Convertir CEDULA a string para la búsqueda
        var cedulaStr = String(p.CEDULA || '').toLowerCase();
        var nombreStr = (p.NOMBRE || '').toLowerCase();
        
        if (cedulaStr.indexOf(terminoBusqueda) !== -1 || nombreStr.indexOf(terminoBusqueda) !== -1) {
            resultados.push(p);
        }
    }

    if (resultados.length === 0) {
        mostrarMensaje('No se encontraron usuarios con ese criterio de búsqueda', 'info');
        renderizarTabla([]);
    } else {
        mostrarMensaje('Se encontraron ' + resultados.length + ' usuario(s)', 'exito');
        renderizarTabla(resultados);
    }
    btnLimpiar.classList.remove('oculto');
}

/**
 * Vacía el campo de búsqueda, oculta el botón Limpiar y vuelve a mostrar todos los usuarios en la tabla.
 */
function limpiarBusqueda() {
    document.getElementById('busqueda').value = '';
    document.getElementById('btn-limpiar').classList.add('oculto');
    renderizarTabla(usuariosCache);
    if (usuariosCache.length === 0) {
        obtenerPropietarios();
    }
}

// --- Funciones globales para acceso desde HTML ---
window.editarPropietario = editarPropietario;
window.confirmarEliminar = confirmarEliminar;
