-- Migración: Agregar campo Estado a la tabla inscripcion
-- Fecha: 2026-07-23
-- Descripción: Agrega el campo Estado para permitir desvinculación lógica de estudiantes

-- Verificar si la columna Estado existe antes de agregarla
SET @dbname = DATABASE();
SET @tablename = 'inscripcion';
SET @columnname = 'Estado';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_schema = @dbname)
      AND (table_name = @tablename)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(30) DEFAULT \'Activa\'')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Actualizar registros existentes para que tengan Estado = 'Activa'
UPDATE inscripcion
SET Estado = 'Activa'
WHERE Estado IS NULL OR Estado = '';

-- Verificar la estructura de la tabla después de la migración
DESCRIBE inscripcion;
