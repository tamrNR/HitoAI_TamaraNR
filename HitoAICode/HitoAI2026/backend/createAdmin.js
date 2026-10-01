require('dotenv').config(); // Cargar variables de entorno desde .env
const usuarioService = require('./services/usuario.service');
const connection = require('./db/connection');

// --- Datos del usuario administrador a crear ---
const adminUser = {
    ID_Usuario: '21259329K', // RUT sin puntos, guion y con K mayúscula
    Nombre: 'Tamara Navaro',
    Clave: '12345',
    Rol_ID_Rol: 1 // 1 para Administrador
};
// ---------------------------------------------

async function createAdmin() {
    console.log('Iniciando la creación del usuario administrador...');
    try {
        // Usamos el servicio existente que ya hashea la clave
        await usuarioService.crearUsuario(
            adminUser.ID_Usuario,
            adminUser.Nombre,
            adminUser.Clave,
            adminUser.Rol_ID_Rol
        );
        console.log(`✅ Usuario administrador "${adminUser.Nombre}" creado exitosamente.`);
        console.log('Ahora puedes iniciar sesión con el RUT 21259329-K y la clave 12345.');
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.error(`❌ Error: El usuario con RUT ${adminUser.ID_Usuario} ya existe en la base de datos.`);
        } else {
            console.error('❌ Ocurrió un error al crear el usuario administrador:', error);
        }
    } finally {
        // Cerramos la conexión a la BD para que el script termine
        connection.end();
        console.log('Conexión a la base de datos cerrada.');
    }
}

createAdmin();
