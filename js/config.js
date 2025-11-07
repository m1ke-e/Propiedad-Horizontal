// Configuración de Firebase

const FIREBASE_CONFIG = {
    PROJECT_ID: 'propiedad-horizontal-f6b13',
    DATABASE_ID: '(default)'
};

// URL base para Firebase REST API
const FIREBASE_API_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.PROJECT_ID}/databases/${FIREBASE_CONFIG.DATABASE_ID}/documents`;

// Colección de propietarios
const COLECCION_PROPIETARIOS = 'propietarios';

// Función helper para construir URL completa
function obtenerUrlColeccion() {
    return `${FIREBASE_API_BASE}/${COLECCION_PROPIETARIOS}`;
}

// Función helper para obtener URL de un documento específico
function obtenerUrlDocumento(documentId) {
    return `${FIREBASE_API_BASE}/${COLECCION_PROPIETARIOS}/${documentId}`;
}

