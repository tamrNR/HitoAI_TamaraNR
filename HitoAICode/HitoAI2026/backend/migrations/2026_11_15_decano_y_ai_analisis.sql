-- =============================================================
-- Migración: rol Decano + vínculo usuario-facultad + esquema IA
-- Fecha: 2026-11-15
--
-- IMPORTANTE: ejecutar sobre la base real. Revisar duplicados antes
-- de agregar llaves/constraints. Este archivo NO contiene datos.
-- =============================================================

-- 1) Rol Decano (idempotente por nombre; ajustar ID_Rol si colisiona)
INSERT INTO rol (ID_Rol, Nombre)
SELECT 5, 'Decano'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM rol WHERE Nombre = 'Decano');

-- 2) Vínculo usuario -> facultad (para alcance del Decano)
--    Ejecutar solo si la columna no existe:
-- ALTER TABLE usuario
--   ADD COLUMN Facultad_ID_Facultad INT NULL AFTER Rol_ID_Rol,
--   ADD CONSTRAINT fk_usuario_facultad
--     FOREIGN KEY (Facultad_ID_Facultad) REFERENCES facultad (ID_Facultad);

-- 3) Columna de asignatura en evaluacion (ya existe en la BD real;
--    el dump hitoai.sql está desactualizado). Ejecutar solo si falta:
-- ALTER TABLE evaluacion
--   ADD COLUMN asignatura_ID_Asignatura VARCHAR(10) NULL;

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

-- 5) PK compuesta de ra_competencia (el dump no la incluye).
--    Ejecutar solo si no tiene PRIMARY KEY y no hay duplicados:
-- ALTER TABLE ra_competencia
--   ADD PRIMARY KEY (ra_ID_RA, competencia_ID_Competencia);

-- 6) evaluacion_estudiante: solo se usa DELETE ... WHERE ID_Evaluacion = ?
--    (evaluacion.service.js). Definición real pendiente de verificar
--    contra la BD productiva antes de crearla.

-- 7) Vistas vw_logro_competencia / vw_logro_ra / vw_logro_estudiante:
--    usadas por routes/analisis.routes.js y routes/graficos.routes.js.
--    No reconstruibles desde el código: exportarlas desde la BD real
--    con SHOW CREATE VIEW y documentarlas aquí.
