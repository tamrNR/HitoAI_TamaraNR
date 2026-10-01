require('dotenv').config();
const usuarioService = require('./services/usuario.service');
const connection = require('./db/connection');

// Configuración del usuario a actualizar
const config = {
    ID_Usuario: '21259329K', // RUT sin puntos, guion y con K mayúscula
    NuevaClave: '12345'
};

async function resetPassword() {
    console.log('🔄 Iniciando reseteo de contraseña...');
    console.log(`📋 Usuario: ${config.ID_Usuario}`);
    
    try {
        // Verificar si el usuario existe
        const existe = await usuarioService.existe(config.ID_Usuario);
        
        if (!existe) {
            console.log('❌ Error: El usuario no existe en la base de datos.');
            console.log('💡 Ejecuta: node createAdmin.js para crear el usuario.');
            connection.end();
            return;
        }

        console.log('✅ Usuario encontrado');
        console.log('🔐 Actualizando contraseña...');
        
        // Actualizar la contraseña (ya viene con hash en el servicio)
        await usuarioService.actualizarClave(config.ID_Usuario, config.NuevaClave);
        
        console.log('✅ ¡Contraseña actualizada exitosamente!');
        console.log('');
        console.log('📝 Credenciales actualizadas:');
        console.log(`   Usuario/RUT: 21259329-K (o 21259329K)`);
        console.log(`   Contraseña: ${config.NuevaClave}`);
        console.log('');
        console.log('🌐 Ahora puedes iniciar sesión en http://localhost:4200');
        
    } catch (error) {
        console.error('❌ Error al resetear la contraseña:', error);
    } finally {
        connection.end();
        console.log('🔌 Conexión a la base de datos cerrada.');
    }
}

resetPassword();
