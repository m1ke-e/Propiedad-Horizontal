// Variables globales
let modoEdicion = false;
let documentoIdActual = null;
let propietariosCache = [];

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

// Inicializar aplicación
function inicializarApp() {
    const formulario = document.getElementById('form-propietario');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnBuscar = document.getElementById('btn-buscar');
    const btnLimpiar = document.getElementById('btn-limpiar');
    const inputBusqueda = document.getElementById('busqueda');

    // Event listeners
    formulario.addEventListener('submit', manejarSubmit);
    btnCancelar.addEventListener('click', cancelarEdicion);
    btnBuscar.addEventListener('click', realizarBusqueda);
    btnLimpiar.addEventListener('click', limpiarBusqueda);
    
    // Buscar al presionar Enter
    inputBusqueda.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            realizarBusqueda();
        }
    });

    // Cargar propietarios al iniciar
    obtenerPropietarios();
}

// ==================== FUNCIONES CRUD ====================

/**
 * CREATE - Crear nuevo propietario
 */
async function crearPropietario(datos) {
    try {
        const url = obtenerUrlColeccion();
        
        // Convertir datos a formato Firestore
        const documento = convertirAFirestore(datos);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(documento)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error al crear propietario');
        }

        const resultado = await response.json();
        mostrarMensaje('Propietario creado exitosamente', 'exito');
        return resultado;
    } catch (error) {
        console.error('Error al crear propietario:', error);
        mostrarMensaje('Error al crear propietario: ' + error.message, 'error');
        throw error;
    }
}

/**
 * READ - Obtener todos los propietarios
 */
async function obtenerPropietarios() {
    try {
        const url = obtenerUrlColeccion();
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error al obtener propietarios');
        }

        const resultado = await response.json();
        
        // Convertir respuesta de Firestore a formato simple
        if (resultado.documents) {
            propietariosCache = resultado.documents.map(doc => convertirDesdeFirestore(doc));
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
 * READ - Buscar propietario por cédula
 */
async function obtenerPropietarioPorCedula(cedula) {
    try {
        // Primero obtener todos y filtrar por cédula
        const propietarios = await obtenerPropietarios();
        const propietario = propietarios.find(p => p.cedula === cedula);
        
        if (!propietario) {
            throw new Error('Propietario no encontrado');
        }
        
        return propietario;
    } catch (error) {
        console.error('Error al buscar propietario:', error);
        throw error;
    }
}

/**
 * UPDATE - Actualizar propietario existente
 */
async function actualizarPropietario(documentId, datos) {
    try {
        const url = obtenerUrlDocumento(documentId);
        
        // Convertir datos a formato Firestore para actualización
        const camposActualizados = convertirAFirestore(datos, true);

        const response = await fetch(url + '?updateMask.fieldPaths=nombre&updateMask.fieldPaths=cedula&updateMask.fieldPaths=email&updateMask.fieldPaths=celular&updateMask.fieldPaths=apartamento&updateMask.fieldPaths=fechaIngreso', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: camposActualizados.fields
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error al actualizar propietario');
        }

        const resultado = await response.json();
        mostrarMensaje('Propietario actualizado exitosamente', 'exito');
        return resultado;
    } catch (error) {
        console.error('Error al actualizar propietario:', error);
        mostrarMensaje('Error al actualizar propietario: ' + error.message, 'error');
        throw error;
    }
}

/**
 * DELETE - Eliminar propietario
 */
async function eliminarPropietario(documentId) {
    try {
        const url = obtenerUrlDocumento(documentId);

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error al eliminar propietario');
        }

        mostrarMensaje('Propietario eliminado exitosamente', 'exito');
        return true;
    } catch (error) {
        console.error('Error al eliminar propietario:', error);
        mostrarMensaje('Error al eliminar propietario: ' + error.message, 'error');
        throw error;
    }
}

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Convertir datos simples a formato Firestore
 */
function convertirAFirestore(datos, soloCampos = false) {
    const campos = {
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

    return {
        fields: campos
    };
}

/**
 * Convertir documento Firestore a formato simple
 */
function convertirDesdeFirestore(documento) {
    const campos = documento.fields || {};
    const nombre = documento.name.split('/').pop(); // Extraer ID del documento
    
    return {
        id: nombre,
        nombre: campos.nombre?.stringValue || '',
        cedula: campos.cedula?.stringValue || '',
        email: campos.email?.stringValue || '',
        celular: campos.celular?.stringValue || '',
        apartamento: campos.apartamento?.stringValue || '',
        fechaIngreso: campos.fechaIngreso?.stringValue || ''
    };
}

/**
 * Renderizar tabla con propietarios
 */
function renderizarTabla(propietarios) {
    const tbody = document.getElementById('tabla-body');
    
    if (propietarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay propietarios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = propietarios.map(propietario => `
        <tr>
            <td>${escapeHtml(propietario.nombre)}</td>
            <td>${escapeHtml(propietario.cedula)}</td>
            <td>${escapeHtml(propietario.email)}</td>
            <td>${escapeHtml(propietario.celular)}</td>
            <td>${escapeHtml(propietario.apartamento)}</td>
            <td>${formatearFecha(propietario.fechaIngreso)}</td>
            <td class="acciones-cell">
                <button class="btn btn-edit" onclick="editarPropietario('${propietario.id}', '${escapeHtml(propietario.cedula)}')">Editar</button>
                <button class="btn btn-danger" onclick="confirmarEliminar('${propietario.id}', '${escapeHtml(propietario.nombre)}')">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Manejar submit del formulario
 */
async function manejarSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const datos = {
        nombre: formData.get('nombre').trim(),
        cedula: formData.get('cedula').trim(),
        email: formData.get('email').trim(),
        celular: formData.get('celular').trim(),
        apartamento: formData.get('apartamento').trim(),
        fechaIngreso: formData.get('fecha-ingreso')
    };

    // Validación básica
    if (!validarDatos(datos)) {
        return;
    }

    try {
        if (modoEdicion) {
            // Actualizar
            await actualizarPropietario(documentoIdActual, datos);
        } else {
            // Crear
            await crearPropietario(datos);
        }
        
        // Limpiar formulario y recargar tabla
        limpiarFormulario();
        await obtenerPropietarios();
    } catch (error) {
        // El error ya se muestra en las funciones CRUD
    }
}

/**
 * Editar propietario
 */
async function editarPropietario(documentId, cedula) {
    try {
        // Buscar en cache primero
        let propietario = propietariosCache.find(p => p.id === documentId);
        
        if (!propietario) {
            // Si no está en cache, obtenerlo
            propietario = await obtenerPropietarioPorCedula(cedula);
        }

        // Cargar datos en formulario
        document.getElementById('nombre').value = propietario.nombre;
        document.getElementById('cedula').value = propietario.cedula;
        document.getElementById('email').value = propietario.email;
        document.getElementById('celular').value = propietario.celular;
        document.getElementById('apartamento').value = propietario.apartamento;
        document.getElementById('fecha-ingreso').value = propietario.fechaIngreso;

        // Cambiar a modo edición
        modoEdicion = true;
        documentoIdActual = documentId;
        document.getElementById('form-titulo').textContent = 'Editar Propietario';
        document.getElementById('btn-cancelar').classList.remove('oculto');
        document.getElementById('cedula').disabled = true; // No permitir cambiar cédula

        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        mostrarMensaje('Error al cargar datos del propietario: ' + error.message, 'error');
    }
}

/**
 * Cancelar edición
 */
function cancelarEdicion() {
    modoEdicion = false;
    documentoIdActual = null;
    limpiarFormulario();
    document.getElementById('form-titulo').textContent = 'Nuevo Propietario';
    document.getElementById('btn-cancelar').classList.add('oculto');
    document.getElementById('cedula').disabled = false;
}

/**
 * Confirmar eliminación
 */
function confirmarEliminar(documentId, nombre) {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`)) {
        eliminarPropietario(documentId).then(() => {
            obtenerPropietarios();
        });
    }
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
    document.getElementById('form-propietario').reset();
    cancelarEdicion();
}

/**
 * Mostrar mensaje al usuario
 */
function mostrarMensaje(texto, tipo = 'info') {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.classList.remove('oculto');

    // Ocultar después de 5 segundos
    setTimeout(() => {
        mensajeDiv.classList.add('oculto');
    }, 5000);
}

/**
 * Validar datos del formulario
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
 * Validar formato de email
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Formatear fecha para mostrar
 */
function formatearFecha(fecha) {
    if (!fecha) return '-';
    try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return fecha;
    }
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Realizar búsqueda por cédula o apartamento
 */
function realizarBusqueda() {
    const terminoBusqueda = document.getElementById('busqueda').value.trim().toLowerCase();
    const btnLimpiar = document.getElementById('btn-limpiar');

    if (!terminoBusqueda) {
        mostrarMensaje('Ingresa un término de búsqueda', 'info');
        return;
    }

    // Filtrar propietarios del cache
    const resultados = propietariosCache.filter(propietario => {
        const cedula = propietario.cedula.toLowerCase();
        const apartamento = propietario.apartamento.toLowerCase();
        
        return cedula.includes(terminoBusqueda) || apartamento.includes(terminoBusqueda);
    });

    if (resultados.length === 0) {
        mostrarMensaje('No se encontraron propietarios con ese criterio de búsqueda', 'info');
        renderizarTabla([]);
    } else {
        mostrarMensaje(`Se encontraron ${resultados.length} propietario(s)`, 'exito');
        renderizarTabla(resultados);
    }

    // Mostrar botón limpiar
    btnLimpiar.classList.remove('oculto');
}

/**
 * Limpiar búsqueda y mostrar todos los propietarios
 */
function limpiarBusqueda() {
    document.getElementById('busqueda').value = '';
    document.getElementById('btn-limpiar').classList.add('oculto');
    renderizarTabla(propietariosCache);
    
    if (propietariosCache.length === 0) {
        obtenerPropietarios();
    }
}

