# Gestión de Propiedad Horizontal

Aplicación web sencilla para gestionar propietarios (CRUD).  
Login con usuario/contraseña en el navegador, datos en Firebase Firestore.

## Cómo funciona

- **index.html**: Redirige a login o al dashboard según si hay sesión.
- **login.html**: Formulario de usuario y contraseña (auth.js + login.js).
- **dashboard.html**: Menú con enlace a CRUD de propietarios (dashboard.js).
- **crud.html**: Alta, edición, listado y eliminación de propietarios (config.js + app.js).

La base de datos es Firestore (Firebase). Las URLs se configuran en `js/config.js`.

## Despliegue

Puedes subir la carpeta del proyecto a **Cloudflare Pages** (o cualquier hosting estático) sin usar Wrangler. Solo necesitas que se sirvan los archivos HTML, CSS y JS.

## Requisitos

- Proyecto en Firebase con Firestore y una colección `propietarios`.
- Usuario de prueba: `admin` / contraseña: `12345` (está en `js/auth.js`).
