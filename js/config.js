/**
 * CONFIG.JS - Configuración de Supabase
 * Aquí guardamos los datos necesarios para conectar con la API de Supabase.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// URL de tu proyecto Supabase
const SUPABASE_URL = 'https://ibmavkbhyqobkinntpsy.supabase.co';

// Clave anónima (anon key) desde la configuración de Supabase
const SUPABASE_ANON_KEY = 'sb_publishable_vDg4rg2KEkcVby5RFkCLTQ_x64iiXdB';

// Nombre de la tabla donde guardamos los usuarios
const SUPABASE_TABLE = 'Usuarios';

// Crear el cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar la tabla para referencia
export { SUPABASE_TABLE };
