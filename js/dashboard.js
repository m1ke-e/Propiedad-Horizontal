/**
 * DASHBOARD.JS - Lógica del menú principal
 * Al cargar: comprueba que el usuario esté logueado y renderiza el dashboard según rol.
 * El botón "Cerrar Sesión" pregunta confirmación y luego cierra sesión (auth.js).
 */

import { verificarAutenticacion, cerrarSesion, esAdmin } from './auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    await verificarAutenticacion();

    const admin = await esAdmin();
    renderDashboard(admin);

    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            cerrarSesion();
        }
    });
});

/**
 * Renderiza el dashboard con contenido distinto para administrador y usuario normal.
 * @param {boolean} admin
 */
function renderDashboard(admin) {
    const title = document.getElementById('dashboard-title');
    const subtitle = document.getElementById('dashboard-subtitle');
    const grid = document.getElementById('dashboard-grid');

    if (!title || !subtitle || !grid) return;

    if (admin) {
        title.textContent = 'Perfil Administrador';
        subtitle.textContent = 'Panel administrativo con acceso completo al sistema.';
        grid.innerHTML = `
            <div class="card dashboard-card h-100">
                <div class="card-body text-center d-flex flex-column">
                    <div class="card-icon display-1 mb-3">👥</div>
                    <h3 class="card-title h5">Usuarios</h3>
                    <p class="card-text text-muted flex-grow-1">Gestiona usuarios, permisos y roles.</p>
                    <button class="btn btn-primary btn-card w-100" onclick="window.location.href='crud.html'">
                        Administrar usuarios
                    </button>
                </div>
            </div>
            <div class="card dashboard-card h-100">
                <div class="card-body text-center d-flex flex-column">
                    <div class="card-icon display-1 mb-3">📊</div>
                    <h3 class="card-title h5">Reportes</h3>
                    <p class="card-text text-muted flex-grow-1">Revisa métricas, facturas y actividad.</p>
                    <button class="btn btn-primary btn-card w-100" onclick="mostrarMensaje('Reportes de administrador en desarrollo')">
                        Ver reportes
                    </button>
                </div>
            </div>
            <div class="card dashboard-card h-100">
                <div class="card-body text-center d-flex flex-column">
                    <div class="card-icon display-1 mb-3">⚙️</div>
                    <h3 class="card-title h5">Configuración</h3>
                    <p class="card-text text-muted flex-grow-1">Ajustes del sistema y la comunidad.</p>
                    <button class="btn btn-primary btn-card w-100" onclick="mostrarMensaje('Configuración en desarrollo')">
                        Ver configuración
                    </button>
                </div>
            </div>
        `;
    } else {
        title.textContent = 'Menú Principal';
        subtitle.textContent = 'Selecciona una opción para continuar';
        grid.innerHTML = `
            <div class="card dashboard-card h-100">
                <div class="card-body text-center d-flex flex-column">
                    <div class="card-icon display-1 mb-3">💰</div>
                    <h3 class="card-title h5">Facturación</h3>
                    <p class="card-text text-muted flex-grow-1">Gestión de facturas y pagos.</p>
                    <button class="btn btn-primary btn-card w-100" onclick="mostrarMensaje('Facturación en desarrollo')">
                        Acceder
                    </button>
                </div>
            </div>
            <div class="card dashboard-card h-100">
                <div class="card-body text-center d-flex flex-column">
                    <div class="card-icon display-1 mb-3">📋</div>
                    <h3 class="card-title h5">PQRS</h3>
                    <p class="card-text text-muted flex-grow-1">Peticiones, Quejas, Reclamos y Sugerencias.</p>
                    <button class="btn btn-primary btn-card w-100" onclick="mostrarMensaje('PQRS en desarrollo')">
                        Acceder
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Muestra un mensaje temporal en el dashboard (ej: "Facturación en desarrollo").
 * @param {string} texto - Mensaje a mostrar
 */
function mostrarMensaje(texto) {
    const mensajeDiv = document.getElementById('mensaje');
    if (!mensajeDiv) return;

    mensajeDiv.textContent = texto;
    mensajeDiv.className = 'alert alert-info';
    mensajeDiv.classList.remove('oculto');

    setTimeout(function() {
        mensajeDiv.classList.add('oculto');
    }, 3000);
}

window.mostrarMensaje = mostrarMensaje;
