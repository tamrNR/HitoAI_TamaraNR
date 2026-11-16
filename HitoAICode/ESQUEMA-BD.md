# Esquema de base de datos — HitoAI

> `hitoai.sql` (raíz de `HitoAICode/`) es un dump **desactualizado** (ago-2025).
> No usarlo como fuente de verdad. Este documento resume las diferencias
> verificadas contra el código actual y la migración
> `HitoAI2026/backend/migrations/2026_11_15_decano_y_ai_analisis.sql`.

## Regenerar el dump (sin datos)

```bash
mysqldump -u USUARIO -p --no-data --routines --triggers HitoAI > hitoai.esquema.sql
```

Para incluir solo catálogos (roles, facultades): exportar los `INSERT` de
`rol`, `facultad` y `carrera` manualmente o usar `--where` por tabla.

## Objetos que el dump NO contiene (pero el código sí usa)

| Objeto | Uso en código | Evidencia |
|---|---|---|
| Tabla `ai_analisis` | Caché/bitácora de análisis IA | `backend/services/aiAnalisis.repository.js` |
| Tabla `evaluacion_estudiante` | Limpieza al eliminar evaluación | `backend/services/evaluacion.service.js` (DELETE) |
| Vistas `vw_logro_competencia`, `vw_logro_ra`, `vw_logro_estudiante` | Analítica y gráficos | `backend/routes/analisis.routes.js`, `graficos.routes.js` |
| Columna `evaluacion.asignatura_ID_Asignatura` | Crear evaluación con aplicaciones | `backend/services/evaluacion.service.js` |
| Rol `Decano` | Nuevo rol de solo lectura | Migración `2026_11_15_decano_y_ai_analisis.sql` |
| Columna `usuario.Facultad_ID_Facultad` | Ámbito del Decano | Migración + `usuario.service.js` |
| PK compuesta `ra_competencia(ra_ID_RA, competencia_ID_Competencia)` | Integridad del mapa RA↔competencia | Migración (comentada) |
| Columna `inscripcion.Estado` | Inscripción activa/desvinculada | `backend/migrations/add_estado_inscripcion.sql` |

## Columnas del dump que el código usa y conviene verificar

- `asignatura.Umbral` (umbral por asignatura, 0–100).
- `inscripcion.Anio`, `inscripcion.Semestre`, `inscripcion.Estado`.
- `aplicacion.Grupo`, `aplicacion.Obtenido`.

## Pendiente

- Exportar `SHOW CREATE VIEW` de las tres `vw_logro_*` desde la BD real y
  documentarlas aquí o en un `views.sql` versionado.
- Definición real de `evaluacion_estudiante` (solo se conoce el DELETE).
