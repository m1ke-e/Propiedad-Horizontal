/**
 * APP.JS - CRUD de propietarios (Crear, Leer, Actualizar, Eliminar)
 * Usa la API REST de Firestore (config.js). La lista se guarda en propietariosCache
 * para no pedirla otra vez al servidor cuando buscas o editas.
 */

// ¿Estamos editando un propietario existente o creando uno nuevo?
var modoEdicion = false;
// ID del documento en Firestore que estamos editando (solo tiene valor en modo edición)
var documentoIdActual = null;
// Copia en memoria de todos los propietarios (para búsqueda y para cargar al editar)
var propietariosCache = [];

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

// --- CRUD (operaciones con Firestore) ---

/**
 * CREATE: Crea un nuevo propietario en Firestore.
 * @param {Object} datos - Objeto con nombre, cedula, email, celular, apartamento, fechaIngreso
 */
async function crearPropietario(datos) {
    try {
        var url = obtenerUrlColeccion();
        var documento = convertirAFirestore(datos);

        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(documento)
        });

        if (!response.ok) {
            var errorData = await response.json();
            throw new Error(errorData.error && errorData.error.message ? errorData.error.message : 'Error al crear propietario');
        }

        mostrarMensaje('Propietario creado exitosamente', 'exito');
        return await response.json();
    } catch (error) {
        console.error('Error al crear propietario:', error);
        mostrarMensaje('Error al crear propietario: ' + error.message, 'error');
        throw error;
    }
}

/**
 * READ: Obtiene todos los propietarios de Firestore, los guarda en propietariosCache y pinta la tabla.
 */
async function obtenerPropietarios() {
    try {
        var url = obtenerUrlColeccion();
        var response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            var errorData = await response.json();
            throw new Error(errorData.error && errorData.error.message ? errorData.error.message : 'Error al obtener propietarios');
        }

        var resultado = await response.json();

        if (resultado.documents) {
            propietariosCache = resultado.documents.map(function(doc) { return convertirDesdeFirestore(doc); });
            renderizarTabla(propietariosCache);
        } else {
            propietariosCache = [];
            renderizarTabla([]);
        }

        return propietariosCache;
    } catch (error) {
        console.error('Error al obtener propietarios:', error);
        mostrarMensaje('Error al cargar propietarios: ' + error.message, 'error');
        renderizarTabla([]);
        return [];
    }
}

/**
 * READ (uno): Busca un propietario por cédula. Primero carga todos y luego filtra.
 * @param {string} cedula
 * @returns {Object} El propietario encontrado
 */
async function obtenerPropietarioPorCedula(cedula) {
    var propietarios = await obtenerPropietarios();
    var propietario = null;
    for (var i = 0; i < propietarios.length; i++) {
        if (propietarios[i].cedula === cedula) {
            propietario = propietarios[i];
            break;
        }
    }
    if (!propietario) {
        throw new Error('Propietario no encontrado');
    }
    return propietario;
}

/**
 * UPDATE: Actualiza un documento existente en Firestore.
 * @param {string} documentId - ID del documento en Firestore
 * @param {Object} datos - Campos a actualizar (nombre, cedula, email, etc.)
 */
async function actualizarPropietario(documentId, datos) {
    try {
        var url = obtenerUrlDocumento(documentId);
        var camposActualizados = convertirAFirestore(datos, true);

        var urlConMask = url + '?updateMask.fieldPaths=nombre&updateMask.fieldPaths=cedula&updateMask.fieldPaths=email&updateMask.fieldPaths=celular&updateMask.fieldPaths=apartamento&updateMask.fieldPaths=fechaIngreso';
        var response = await fetch(urlConMask, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: camposActualizados.fields })
        });

        if (!response.ok) {
            var errorData = await response.json();
            throw new Error(errorData.error && errorData.error.message ? errorData.error.message : 'Error al actualizar propietario');
        }

        mostrarMensaje('Propietario actualizado exitosamente', 'exito');
        return await response.json();
    } catch (error) {
        console.error('Error al actualizar propietario:', error);
        mostrarMensaje('Error al actualizar propietario: ' + error.message, 'error');
        throw error;
    }
}

/**
 * DELETE: Elimina un documento de Firestore.
 * @param {string} documentId - ID del documento a eliminar
 */
async function eliminarPropietario(documentId) {
    try {
        var url = obtenerUrlDocumento(documentId);
        var response = await fetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            var errorData = await response.json();
            throw new Error(errorData.error && errorData.error.message ? errorData.error.message : 'Error al eliminar propietario');
        }

        mostrarMensaje('Propietario eliminado exitosamente', 'exito');
        return true;
    } catch (error) {
        console.error('Error al eliminar propietario:', error);
        mostrarMensaje('Error al eliminar propietario: ' + error.message, 'error');
        throw error;
    }
}

// --- Conversión de datos (Firestore usa un formato especial) ---

/**
 * Convierte nuestro objeto simple { nombre, cedula, ... } al formato que pide Firestore.
 * @param {Object} datos - Objeto con los campos del propietario
 * @param {boolean} soloCampos - Si es true, devuelve solo { fields: {...} } (para PATCH)
 */
function convertirAFirestore(datos, soloCampos) {
    var campos = {
        nombre: { stringValue: datos.nombre },
        cedula: { stringValue: datos.cedula },
        email: { stringValue: datos.email },
        celular: { stringValue: datos.celular },
        apartamento: { stringValue: datos.apartamento },
        fechaIngreso: { stringValue: datos.fechaIngreso }
    };

    if (soloCampos) {
        return { fields: campos };
    }
    return { fields: campos };
}

/**
 * Convierte un documento que devuelve Firestore a un objeto simple { id, nombre, cedula, ... }.
 * El ID se saca del campo "name" del documento (ej: "projects/.../documents/propietarios/abc123" -> "abc123").
 * @param {Object} documento - Documento tal como viene de la API de Firestore
 */
function convertirDesdeFirestore(documento) {
    var campos = documento.fields || {};
    var partes = documento.name.split('/');
    var id = partes[partes.length - 1];

    return {
        id: id,
        nombre: (campos.nombre && campos.nombre.stringValue) ? campos.nombre.stringValue : '',
        cedula: (campos.cedula && campos.cedula.stringValue) ? campos.cedula.stringValue : '',
        email: (campos.email && campos.email.stringValue) ? campos.email.stringValue : '',
        celular: (campos.celular && campos.celular.stringValue) ? campos.celular.stringValue : '',
        apartamento: (campos.apartamento && campos.apartamento.stringValue) ? campos.apartamento.stringValue : '',
        fechaIngreso: (campos.fechaIngreso && campos.fechaIngreso.stringValue) ? campos.fechaIngreso.stringValue : ''
    };
}

// --- Interfaz (tabla y formulario) ---

/**
 * Borra el contenido del tbody y escribe una fila por cada propietario (o un mensaje si no hay ninguno).
 * @param {Array} propietarios - Lista de objetos propietario a mostrar
 */
function renderizarTabla(propietarios) {
    var tbody = document.getElementById('tabla-body');

    if (propietarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay propietarios registrados</td></tr>';
        return;
    }

    var html = '';
    for (var i = 0; i < propietarios.length; i++) {
        var p = propietarios[i];
        html += '<tr>';
        html += '<td>' + escapeHtml(p.nombre) + '</td>';
        html += '<td>' + escapeHtml(p.cedula) + '</td>';
        html += '<td>' + escapeHtml(p.email) + '</td>';
        html += '<td>' + escapeHtml(p.celular) + '</td>';
        html += '<td>' + escapeHtml(p.apartamento) + '</td>';
        html += '<td>' + formatearFecha(p.fechaIngreso) + '</td>';
        html += '<td class="acciones-cell">';
        html += '<button class="btn btn-edit" onclick="editarPropietario(\'' + p.id + '\', \'' + escapeHtml(p.cedula) + '\')">Editar</button> ';
        html += '<button class="btn btn-danger" onclick="confirmarEliminar(\'' + p.id + '\', \'' + escapeHtml(p.nombre) + '\')">Eliminar</button>';
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
        nombre: formData.get('nombre').trim(),
        cedula: formData.get('cedula').trim(),
        email: formData.get('email').trim(),
        celular: formData.get('celular').trim(),
        apartamento: formData.get('apartamento').trim(),
        fechaIngreso: formData.get('fecha-ingreso')
    };

    if (!validarDatos(datos)) {
        return;
    }

    try {
        if (modoEdicion) {
            await actualizarPropietario(documentoIdActual, datos);
        } else {
            await crearPropietario(datos);
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
 * @param {string} documentId - ID del documento en Firestore
 * @param {string} cedula - Cédula (por si hay que cargar el propietario desde el servidor)
 */
async function editarPropietario(documentId, cedula) {
    try {
        var propietario = null;
        for (var i = 0; i < propietariosCache.length; i++) {
            if (propietariosCache[i].id === documentId) {
                propietario = propietariosCache[i];
                break;
            }
        }
        if (!propietario) {
            propietario = await obtenerPropietarioPorCedula(cedula);
        }

        document.getElementById('nombre').value = propietario.nombre;
        document.getElementById('cedula').value = propietario.cedula;
        document.getElementById('email').value = propietario.email;
        document.getElementById('celular').value = propietario.celular;
        document.getElementById('apartamento').value = propietario.apartamento;
        document.getElementById('fecha-ingreso').value = propietario.fechaIngreso;

        modoEdicion = true;
        documentoIdActual = documentId;
        document.getElementById('form-titulo').textContent = 'Editar Propietario';
        document.getElementById('btn-guardar').textContent = 'Actualizar Propietario';
        document.getElementById('btn-cancelar').textContent = 'Cancelar Edición';
        document.getElementById('btn-cancelar').classList.remove('oculto');
        document.getElementById('cedula').readOnly = true;
        document.getElementById('apartamento').readOnly = true;

        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        mostrarMensaje('Error al cargar datos del propietario: ' + error.message, 'error');
    }
}

/**
 * Sale del modo edición: limpia el formulario, restaura títulos y botones y quita readonly de cédula y apartamento.
 */
function cancelarEdicion() {
    modoEdicion = false;
    documentoIdActual = null;
    document.getElementById('form-propietario').reset();
    document.getElementById('form-titulo').textContent = 'Añadir Nuevo Propietario';
    document.getElementById('btn-guardar').textContent = 'Guardar';
    document.getElementById('btn-cancelar').textContent = 'Cancelar';
    document.getElementById('btn-cancelar').classList.add('oculto');
    document.getElementById('cedula').readOnly = false;
    document.getElementById('apartamento').readOnly = false;
}

/**
 * Pide confirmación y, si el usuario acepta, elimina el propietario y vuelve a cargar la tabla.
 * @param {string} documentId - ID del documento a eliminar
 * @param {string} nombre - Nombre del propietario (para mostrar en el mensaje de confirmación)
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
    document.getElementById('form-titulo').textContent = 'Añadir Nuevo Propietario';
    document.getElementById('btn-guardar').textContent = 'Guardar';
    document.getElementById('btn-cancelar').textContent = 'Cancelar';
    document.getElementById('btn-cancelar').classList.add('oculto');
    document.getElementById('cedula').readOnly = false;
    document.getElementById('apartamento').readOnly = false;
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
    mensajeDiv.className = 'mensaje ' + tipo;
    mensajeDiv.classList.remove('oculto');
    setTimeout(function() {
        mensajeDiv.classList.add('oculto');
    }, 5000);
}

/**
 * Comprueba que nombre, cédula, email, celular, apartamento y fecha estén bien. Si algo falla, muestra mensaje y devuelve false.
 * @param {Object} datos
 * @returns {boolean}
 */
function validarDatos(datos) {
    if (!datos.nombre || datos.nombre.length < 3) {
        mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
        return false;
    }
    if (!datos.cedula || datos.cedula.length < 5) {
        mostrarMensaje('La cédula debe tener al menos 5 caracteres', 'error');
        return false;
    }
    if (!datos.email || !validarEmail(datos.email)) {
        mostrarMensaje('Ingresa un email válido', 'error');
        return false;
    }
    if (!datos.celular || datos.celular.length < 7) {
        mostrarMensaje('Ingresa un número de celular válido', 'error');
        return false;
    }
    if (!datos.apartamento || datos.apartamento.length < 1) {
        mostrarMensaje('Ingresa un número de apartamento', 'error');
        return false;
    }
    if (!datos.fechaIngreso) {
        mostrarMensaje('Selecciona una fecha de ingreso', 'error');
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
 * Filtra propietariosCache por cédula o número de apartamento (según lo que escribió el usuario) y pinta solo esos en la tabla.
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
    for (var i = 0; i < propietariosCache.length; i++) {
        var p = propietariosCache[i];
        if (p.cedula.toLowerCase().indexOf(terminoBusqueda) !== -1 || p.apartamento.toLowerCase().indexOf(terminoBusqueda) !== -1) {
            resultados.push(p);
        }
    }

    if (resultados.length === 0) {
        mostrarMensaje('No se encontraron propietarios con ese criterio de búsqueda', 'info');
        renderizarTabla([]);
    } else {
        mostrarMensaje('Se encontraron ' + resultados.length + ' propietario(s)', 'exito');
        renderizarTabla(resultados);
    }
    btnLimpiar.classList.remove('oculto');
}

/**
 * Vacía el campo de búsqueda, oculta el botón Limpiar y vuelve a mostrar todos los propietarios en la tabla.
 */
function limpiarBusqueda() {
    document.getElementById('busqueda').value = '';
    document.getElementById('btn-limpiar').classList.add('oculto');
    renderizarTabla(propietariosCache);
    if (propietariosCache.length === 0) {
        obtenerPropietarios();
    }
}
