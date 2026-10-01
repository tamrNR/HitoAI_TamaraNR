require('dotenv').config();
const connection = require('../db/connection');

async function runMigration() {
  try {
    console.log('🔄 Iniciando migración: Actualizar ENUM de Estado en inscripcion...');

    // Verificar el tipo actual de la columna Estado
    const [columns] = await connection.promise().query(`
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'inscripcion'
        AND COLUMN_NAME = 'Estado'
    `);

    const currentType = columns[0]?.COLUMN_TYPE || '';
    console.log('Tipo actual de Estado:', currentType);

    // Verificar si 'Desvinculada' ya está en el ENUM
    if (currentType.includes("'Desvinculada'")) {
      console.log('✅ El valor Desvinculada ya existe en el ENUM');
    } else {
      // Modificar el ENUM para incluir 'Desvinculada'
      await connection.promise().query(`
        ALTER TABLE inscripcion
        MODIFY COLUMN Estado ENUM('Activo', 'Inactivo', 'Desvinculada') DEFAULT 'Activo'
      `);
      console.log('✅ ENUM actualizado para incluir Desvinculada');
    }

    // Verificar la estructura de la tabla
    const [structure] = await connection.promise().query('DESCRIBE inscripcion');
    console.log('📋 Estructura actual de la tabla inscripcion:');
    console.table(structure);

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

runMigration();
