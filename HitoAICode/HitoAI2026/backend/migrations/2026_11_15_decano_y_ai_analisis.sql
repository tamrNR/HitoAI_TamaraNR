-- =============================================================
-- Migración: rol Decano + vínculo usuario-facultad + esquema IA
-- Fecha: 2026-11-15
--
-- Ejecutable de forma idempotente: cada ALTER verifica primero si
-- el objeto ya existe (information_schema), así que puede correrse
-- varias veces sin errores. NO contiene datos de usuarios.
-- =============================================================

-- 1) Rol Decano (idempotente por nombre; ajustar ID_Rol si colisiona)
INSERT INTO rol (ID_Rol, Nombre)
SELECT 5, 'Decano'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE Nombre = 'Decano');

-- 2) Vínculo usuario -> facultad (para alcance del Decano)
--    Columna (solo si no existe):
SET @col_fac := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuario'
    AND COLUMN_NAME = 'Facultad_ID_Facultad'
);
SET @sql_fac := IF(@col_fac = 0,
  'ALTER TABLE usuario ADD COLUMN Facultad_ID_Facultad INT NULL AFTER Rol_ID_Rol',
  'SELECT ''usuario.Facultad_ID_Facultad ya existe'' AS aviso');
PREPARE stmt_fac FROM @sql_fac;
EXECUTE stmt_fac;
DEALLOCATE PREPARE stmt_fac;

--    FK (solo si la columna existe y la constraint no):
SET @fk_fac := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuario'
    AND CONSTRAINT_NAME = 'fk_usuario_facultad'
);
SET @col_fac2 := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuario'
    AND COLUMN_NAME = 'Facultad_ID_Facultad'
);
SET @sql_fk := IF(@fk_fac = 0 AND @col_fac2 = 1,
  'ALTER TABLE usuario ADD CONSTRAINT fk_usuario_facultad FOREIGN KEY (Facultad_ID_Facultad) REFERENCES facultad (ID_Facultad)',
  'SELECT ''fk_usuario_facultad omitida'' AS aviso');
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;

-- 3) Columna de asignatura en evaluacion (solo si falta)
SET @col_eval := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'evaluacion'
    AND COLUMN_NAME = 'asignatura_ID_Asignatura'
);
SET @sql_eval := IF(@col_eval = 0,
  'ALTER TABLE evaluacion ADD COLUMN asignatura_ID_Asignatura VARCHAR(10) NULL',
  'SELECT ''evaluacion.asignatura_ID_Asignatura ya existe'' AS aviso');
PREPARE stmt_eval FROM @sql_eval;
EXECUTE stmt_eval;
DEALLOCATE PREPARE stmt_eval;

-- 4) Tabla ai_analisis (caché/bitácora de análisis IA)
CREATE TABLE IF NOT EXISTS ai_analisis (
  id INT NOT NULL AUTO_INCREMENT,
  tipo_grafico VARCHAR(50) NOT NULL,
  filtros_hash CHAR(64) NOT NULL,
  context_json LONGTEXT NULL,
  chart_json LONGTEXT NULL,
  resultado_json LONGTEXT NULL,
  analysis_text LONGTEXT NULL,
  model VARCHAR(100) NULL,
  prompt_version VARCHAR(50) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ok',
  error_message TEXT NULL,
  created_by VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ai_analisis_hash (tipo_grafico, filtros_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) PK compuesta de ra_competencia (solo si la tabla no tiene PK).
--    OJO: falla si existen filas duplicadas (ra_ID_RA, competencia_ID_Competencia);
--    en ese caso depurar duplicados antes de ejecutar.
SET @pk_rc := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ra_competencia'
    AND CONSTRAINT_TYPE = 'PRIMARY KEY'
);
SET @sql_pk := IF(@pk_rc = 0,
  'ALTER TABLE ra_competencia ADD PRIMARY KEY (ra_ID_RA, competencia_ID_Competencia)',
  'SELECT ''ra_competencia ya tiene PRIMARY KEY'' AS aviso');
PREPARE stmt_pk FROM @sql_pk;
EXECUTE stmt_pk;
DEALLOCATE PREPARE stmt_pk;

-- 6) evaluacion_estudiante: solo se usa DELETE ... WHERE ID_Evaluacion = ?
--    (evaluacion.service.js). Definición real pendiente de verificar
--    contra la BD productiva antes de crearla.

-- 7) Vistas vw_logro_competencia / vw_logro_ra / vw_logro_estudiante:
--    usadas por routes/analisis.routes.js y routes/graficos.routes.js.
--    No reconstruibles desde el código: exportarlas desde la BD real
--    con SHOW CREATE VIEW y documentarlas aquí.
