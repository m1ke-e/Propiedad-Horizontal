/**
 * CONFIG.JS - Configuración de Firebase Firestore
 * Aquí guardamos los datos necesarios para conectar con la base de datos.
 */

// Datos del proyecto en Firebase (los ves en la consola de Firebase)
const FIREBASE_CONFIG = {
    PROJECT_ID: 'propiedad-horizontal-f6b13',
    DATABASE_ID: '(default)'
};

// URL base de la API REST de Firestore (así hablamos con la base de datos desde el navegador)
const FIREBASE_API_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.PROJECT_ID}/databases/${FIREBASE_CONFIG.DATABASE_ID}/documents`;

// Nombre de la colección donde guardamos los propietarios (como una "tabla")
const COLECCION_PROPIETARIOS = 'propietarios';

/**
 * Devuelve la URL para pedir TODOS los documentos de la colección propietarios.
 * Se usa para: crear uno nuevo (POST) y listar todos (GET).
 */
function obtenerUrlColeccion() {
    return `${FIREBASE_API_BASE}/${COLECCION_PROPIETARIOS}`;
}

/**
 * Devuelve la URL de UN documento concreto (por su ID).
 * Se usa para: actualizar (PATCH) y eliminar (DELETE).
 * @param {string} documentId - El ID del documento en Firestore
 */
function obtenerUrlDocumento(documentId) {
    return `${FIREBASE_API_BASE}/${COLECCION_PROPIETARIOS}/${documentId}`;
}
