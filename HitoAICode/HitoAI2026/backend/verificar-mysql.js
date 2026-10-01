// Script para verificar conexión MySQL y ayudar a configurar credenciales
const mysql = require('mysql2');

console.log('🔍 Verificando configuración de MySQL...\n');

// Leer variables de entorno
require('dotenv').config();

console.log('📋 Configuración actual en .env:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   User: ${process.env.DB_USER}`);
console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : '(vacía)'}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   Port: ${process.env.DB_PORT}\n`);

// Intentar conectar con las credenciales actuales
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

connection.connect((err) => {
  if (err) {
    console.log('❌ Error de conexión con credenciales actuales:');
    console.log(`   Código: ${err.code}`);
    console.log(`   Mensaje: ${err.message}\n`);
    
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('🔧 SOLUCIONES:\n');
      console.log('1. Verificar la contraseña de MySQL:');
      console.log('   - Abre MySQL Workbench o terminal de MySQL');
      console.log('   - Ejecuta: ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'tu_nueva_clave\';\n');
      console.log('2. O actualizar el archivo .env con la contraseña correcta:\n');
      console.log('   DB_PASSWORD=tu_contraseña_real_de_mysql\n');
      console.log('3. Si olvidaste la contraseña, resetearla:\n');
      console.log('   - Detener servicio MySQL: net stop MySQL80');
      console.log('   - Iniciar MySQL con --skip-grant-tables');
      console.log('   - Resetear contraseña: ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'nueva_clave\';\n');
    }
    
    process.exit(1);
  } else {
    console.log('✅ Conexión exitosa a MySQL!');
    console.log('✅ Base de datos accesible\n');
    
    // Verificar si la base de datos existe
    connection.query('SHOW DATABASES', (err, results) => {
      if (err) {
        console.log('❌ Error al listar bases de datos:', err.message);
      } else {
        console.log('📊 Bases de datos disponibles:');
        results.forEach(db => console.log(`   - ${db.Database}`));
        
        const dbExists = results.some(db => db.Database === process.env.DB_NAME);
        if (dbExists) {
          console.log(`\n✅ La base de datos "${process.env.DB_NAME}" existe`);
        } else {
          console.log(`\n⚠️ La base de datos "${process.env.DB_NAME}" NO existe`);
          console.log('   Creándola...');
          connection.query(`CREATE DATABASE ${process.env.DB_NAME}`, (err) => {
            if (err) {
              console.log('❌ Error al crear base de datos:', err.message);
            } else {
              console.log('✅ Base de datos creada exitosamente');
            }
            connection.end();
            process.exit(0);
          });
          return;
        }
      }
      connection.end();
      process.exit(0);
    });
  }
});
