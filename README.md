# Gestión de Propiedad Horizontal

Aplicación web sencilla para gestionar propietarios (CRUD).  
Login con usuario/contraseña en el navegador, datos en Supabase.

## Cómo funciona

- **index.html**: Redirige a login o al dashboard según si hay sesión.
- **login.html**: Formulario de usuario y contraseña (auth.js + login.js).
- **dashboard.html**: Menú con enlace a CRUD de propietarios (dashboard.js).
- **crud.html**: Alta, edición, listado y eliminación de propietarios (config.js + app.js).

La base de datos es Supabase. La configuración de la API se hace en `js/config.js`.

## Despliegue

Puedes subir la carpeta del proyecto a **Cloudflare Pages** (o cualquier hosting estático) sin usar Wrangler. Solo necesitas que se sirvan los archivos HTML, CSS y JS.

## Requisitos

- Proyecto en Supabase con una tabla `Usuarios` con columnas:
  - `USU_CODIGO` UUID (clave primaria)
  - `CEDULA` VARCHAR
  - `NOMBRE` VARCHAR
  - `ESTADO` VARCHAR (Activo/Inactivo)
  - `CELULAR` VARCHAR
  - `CORREO` VARCHAR
  - `FECHA_CREACION` TIMESTAMP
  - `FECHA_MODIFICACION` TIMESTAMP
- Usuario de prueba: `admin` / contraseña: `12345` (está en `js/auth.js`).
- Configurar variables de Supabase en `js/config.js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`).
