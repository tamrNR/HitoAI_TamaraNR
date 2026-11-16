-- =============================================================
-- Migración: vínculo usuario -> carrera para Comité Curricular
-- Fecha: 2026-11-16
--
-- El Jefe de Carrera deriva su carrera de carrera.usuario_ID_Usuario;
-- el Comité no tiene vínculo en el esquema original, por lo que su
-- token llegaba con carreraId NULL y todo su scope fallaba (403/vacío).
-- Esta columna guarda la carrera del Comité (una sola por usuario).
-- Idempotente: cada paso verifica information_schema antes de actuar.
-- =============================================================

-- 1) Columna usuario.Carrera_ID_Carrera (solo si no existe)
SET @col_carrera := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuario'
    AND COLUMN_NAME = 'Carrera_ID_Carrera'
);
SET @sql_col := IF(@col_carrera = 0,
  'ALTER TABLE usuario ADD COLUMN Carrera_ID_Carrera INT NULL AFTER Facultad_ID_Facultad',
  'SELECT ''usuario.Carrera_ID_Carrera ya existe'' AS aviso');
PREPARE stmt_col FROM @sql_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;

-- 2) FK a carrera (solo si la columna existe y la constraint no)
SET @fk_carrera := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuario'
    AND CONSTRAINT_NAME = 'fk_usuario_carrera'
);
SET @col_carrera2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuario'
    AND COLUMN_NAME = 'Carrera_ID_Carrera'
);
SET @sql_fk := IF(@fk_carrera = 0 AND @col_carrera2 = 1,
  'ALTER TABLE usuario ADD CONSTRAINT fk_usuario_carrera FOREIGN KEY (Carrera_ID_Carrera) REFERENCES carrera (ID_Carrera)',
  'SELECT ''fk_usuario_carrera omitida'' AS aviso');
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;
