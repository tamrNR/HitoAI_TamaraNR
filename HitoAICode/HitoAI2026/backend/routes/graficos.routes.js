// ===============================
// routes/graficos.routes.js
// Endpoints para alimentar los gráficos de analítica
// (Radar, Barras y Burbujas)
// ===============================

const express = require('express');
const router = express.Router();
const connection = require('../db/connection');
const ALUMNO_CURSO = '__CURSO__';

/**
 * ========================================
 * 1️⃣ GRÁFICO RADAR - Competencias del Alumno
 * ========================================
 * Fuente: vw_logro_estudiante (por competencia institucional)
 *         vw_logro_estudiante_fase (por fase/actividad)
 *
 * Parámetros query:
 * - asignatura: ID de la asignatura (ej: TIS800)
 * - alumno:     ID del estudiante   (ej: 20268128K)
 * - anio:       Año académico       (ej: 2025)
 * - semestre:   Número de semestre  (ej: 8)
 * - nivel:      'competencia' (default) | 'fase'
 *
 * nivel=competencia → muestra las 8 competencias del perfil de egreso.
 *   Las que no tienen evaluaciones aparecen con valor 0.0 (brecha visible).
 * nivel=fase → muestra las fases de la asignatura (comportamiento original).
 */

// Función auxiliar: obtiene el rango de evaluaciones completas para un curso
function obtenerRangoEvaluacionesCompletas(asignatura, anio, semestre, callback) {
  const sql = `
    SELECT 
      Asignatura, Anio, Semestre, ID_Evaluacion, NombreEvaluacion,
      total_estudiantes, total_registros, evaluacion_completa, fecha_evaluacion
    FROM vw_estado_curso
    WHERE Asignatura = ?
      AND Anio = ?
      AND Semestre = ?
      AND fecha_evaluacion <= CURDATE()
    ORDER BY ID_Evaluacion
  `;

  connection.query(sql, [asignatura, anio, semestre], (err, rows) => {
    if (err) {
      console.error('[GraficosRadar] ❌ Error consultando vw_estado_curso:', err);
      return callback(err);
    }

    if (!rows.length) {
      return callback(null, {
        tieneDatos: false,
        mensaje: 'No existen evaluaciones registradas para este curso en el período indicado.'
      });
    }

    const completas = rows.filter(r => Number(r.evaluacion_completa) === 1);

    if (!completas.length) {
      return callback(null, {
        tieneDatos: false,
        mensaje: 'Aún no hay ninguna evaluación completa para este curso. El análisis está pendiente de cierre.'
      });
    }

    const ids = completas.map(r => r.ID_Evaluacion);
    const minEval = Math.min(...ids);
    const maxEval = Math.max(...ids);

    let mensajeRango;
    if (minEval === maxEval) {
      mensajeRango = `El análisis se realizó solo con la nota ${minEval} (${completas[0].NombreEvaluacion}).`;
    } else {
      mensajeRango = `El análisis se realizó con las notas ${minEval} a ${maxEval} (todas las evaluaciones completas hasta la fecha).`;
    }

    callback(null, { tieneDatos: true, minEval, maxEval, mensajeRango });
  });
}

// Función auxiliar: completa con 0 las competencias sin datos (solo para nivel=competencia)
function completarConTodasLasCompetencias(datosObtenidos, callback) {
  const sql = `
    SELECT CONCAT(ID_Competencia, ' · ', TRIM(Nombre)) AS nombre
    FROM competencia
    ORDER BY ID_Competencia
  `;

  connection.query(sql, [], (err, todasCompetencias) => {
    if (err || !todasCompetencias || !todasCompetencias.length) {
      console.warn('[GraficosRadar] ⚠️ No se pudieron obtener todas las competencias, usando solo las evaluadas');
      return callback(datosObtenidos);
    }

    // Mapa de logros obtenidos: nombre → valor
    const mapaLogro = new Map();
    (datosObtenidos || []).forEach(r => mapaLogro.set(r.nombre, r.valor));

    // Completar con 0.0 las que no tienen datos
    const datosCompletos = todasCompetencias.map(c => ({
      nombre: c.nombre,
      valor: mapaLogro.has(c.nombre) ? mapaLogro.get(c.nombre) : '0.0'
    }));

    console.log(`[GraficosRadar] ✅ Competencias completadas: ${datosObtenidos.length} con datos + ${datosCompletos.length - datosObtenidos.length} en 0`);
    callback(datosCompletos);
  });
}

router.get('/radar', (req, res) => {
  const { asignatura, alumno, anio, semestre, nivel } = req.query;

  console.log('[GraficosRadar] 📡 Parámetros recibidos:', { asignatura, alumno, anio, semestre, nivel });

  if (!asignatura || !anio || !semestre) {
    console.warn('[GraficosRadar] ⚠️ Parámetros faltantes o inválidos');
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['asignatura', 'anio', 'semestre'],
      recibidos: { asignatura, alumno, anio, semestre }
    });
  }

  if (!alumno) {
    console.warn('[GraficosRadar] ⚠️ Alumno no proporcionado');
    return res.status(400).json({
      error: 'alumno_requerido',
      mensaje: 'Para el análisis individual del alumno se requiere seleccionar un estudiante.'
    });
  }

  const year = parseInt(anio, 10);
  const sem  = parseInt(semestre, 10);

  if (Number.isNaN(year) || Number.isNaN(sem)) {
    console.warn('[GraficosRadar] ⚠️ Año o semestre no numéricos:', { anio, semestre });
    return res.status(400).json({
      error: 'anio y semestre deben ser numéricos',
      recibidos: { anio, semestre }
    });
  }

  // nivel=fase       → vw_logro_estudiante_fase (visión operativa por actividad)
  // nivel=competencia → vw_logro_estudiante      (visión estratégica, 8 competencias)
  const vista = (nivel === 'fase') ? 'vw_logro_estudiante_fase' : 'vw_logro_estudiante';
  console.log(`[GraficosRadar] 📊 Vista seleccionada: ${vista} (nivel=${nivel || 'competencia'})`);

  obtenerRangoEvaluacionesCompletas(asignatura, year, sem, (errEstado, estado) => {
    if (errEstado) {
      console.error('[GraficosRadar] ❌ Error al validar estado del curso:', errEstado);
    }

    let mensajeRango = 'El análisis se realizó con las evaluaciones del alumno registradas hasta la fecha.';
    if (estado && estado.tieneDatos && estado.mensajeRango) {
      mensajeRango = estado.mensajeRango;
    } else if (estado && !estado.tieneDatos) {
      console.warn('[GraficosRadar] ℹ️ Curso no completo:', estado.mensaje);
    }

    // Para nivel=fase usar consulta DIRECTA sin JOIN (más confiable)
    if (nivel === 'fase') {
      if (alumno === ALUMNO_CURSO) {
        return res.json({
          mensajeRango: 'La vista por Fase no está disponible en modo Curso completo.',
          nivel: 'vw_logro_estudiante_fase',
          datos: []
        });
      }
      const sqlFase = `
        SELECT
          ve.Competencia AS nombre,
          ROUND(AVG(ve.Porcentaje_Logro), 1) AS valor
        FROM vw_logro_estudiante_fase ve
        WHERE ve.ID_Asignatura = ?
          AND ve.ID_Estudiante = ?
          AND ve.Anio = ?
          AND ve.Semestre = ?
        GROUP BY ve.Competencia
        ORDER BY ve.Competencia
      `;
      return connection.query(sqlFase, [asignatura, alumno, year, sem], (errFase, rowsFase) => {
        if (errFase) {
          console.error('[GraficosRadar] ❌ Error en consulta fase:', errFase.message);
          return res.status(500).json({ error: 'Error al obtener datos del radar por fase', detalle: errFase.message });
        }
        if (!rowsFase || !rowsFase.length) {
          // No hay fases registradas → obtener las fases de la asignatura desde la BD
          // para devolver estructura completa con valores en 0
          const sqlFasesBase = `
            SELECT DISTINCT
              CONCAT(e.Orden, '. ', e.Nombre) AS nombre
            FROM evaluacion e
            JOIN contenido c ON c.evaluacion_ID_Evaluacion = e.ID_Evaluacion
            JOIN indicador ind ON ind.contenido_ID_Contenido = c.ID_Contenido
            JOIN inscripcion insc ON insc.asignatura_ID_Asignatura = ?
            WHERE insc.Anio = ? AND insc.Semestre = ?
            ORDER BY e.Orden
          `;
          return connection.query(sqlFasesBase, [asignatura, year, sem], (errFases, rowsFasesBase) => {
            if (errFases || !rowsFasesBase || !rowsFasesBase.length) {
              // Si tampoco hay fases en la BD, devolver array vacío con mensaje claro
              console.warn('[GraficosRadar] ⚠️ Sin fases en BD para:', { asignatura, year, sem });
              return res.json({
                mensajeRango: 'No hay evaluaciones registradas para este alumno en el período indicado.',
                nivel: 'vw_logro_estudiante_fase',
                datos: []
              });
            }
            const datosFasesCero = rowsFasesBase.map(f => ({ nombre: f.nombre, valor: '0.0' }));
            console.log(`[GraficosRadar] ✅ Fase sin datos — devolviendo ${datosFasesCero.length} fases en 0`);
            return res.json({
              mensajeRango: 'No hay evaluaciones registradas para este alumno en el período indicado.',
              nivel: 'vw_logro_estudiante_fase',
              datos: datosFasesCero
            });
          });
        }
        console.log(`[GraficosRadar] ✅ Fase directa: ${rowsFase.length} fases`);
        return res.json({ mensajeRango, nivel: vista, datos: rowsFase });
      });
    }

    if (alumno === ALUMNO_CURSO) {
      const sqlCurso = `
        SELECT
          comp.Competencia AS nombre,
          ROUND(AVG(comp.Porcentaje_Logro_Comp), 1) AS valor
        FROM vw_logro_competencia comp
        WHERE comp.ID_Asignatura = ?
          AND comp.Anio = ?
          AND comp.Semestre = ?
        GROUP BY comp.Competencia
        ORDER BY comp.Competencia
      `;
      return connection.query(sqlCurso, [asignatura, year, sem], (errCurso, rowsCurso) => {
        if (errCurso) {
          console.error('[GraficosRadar] ❌ Error en consulta curso:', errCurso.message);
          return res.status(500).json({ error: 'Error al obtener datos del radar de curso', detalle: errCurso.message });
        }
        return completarConTodasLasCompetencias(rowsCurso || [], (datosCompletos) => {
          console.log(`[GraficosRadar] ✅ Radar Curso: ${datosCompletos.length} competencias`);
          return res.json({ mensajeRango, nivel: 'vw_logro_competencia', datos: datosCompletos });
        });
      });
    }

    // Para nivel=competencia usar consulta directa sin JOIN (más confiable para cohortes antiguas)
    const sql = `
      SELECT
        ve.Competencia AS nombre,
        ROUND(AVG(ve.Porcentaje_Logro), 1) AS valor
      FROM \`${vista}\` ve
      WHERE ve.ID_Asignatura = ?
        AND ve.ID_Estudiante = ?
        AND ve.Anio = ?
        AND ve.Semestre = ?
      GROUP BY ve.Competencia
      ORDER BY ve.Competencia
    `;

    console.log('[GraficosRadar] 🧗 SQL a ejecutar con valores:', [asignatura, alumno, year, sem]);

    connection.query(sql, [asignatura, alumno, year, sem], (err, rows) => {
      if (err) {
        console.error('[GraficosRadar] ❌ Error en consulta SQL (con join vw_estado_curso):', err.message);

        const retriableCodes = new Set(['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR']);
        if (retriableCodes.has(err.code)) {
          console.warn('[GraficosRadar] ↩️ Reintentando consulta SIMPLIFICADA sin JOIN...');

          const fallbackSql = `
            SELECT 
              ve.Competencia AS nombre,
              ROUND(AVG(ve.Porcentaje_Logro), 1) AS valor
            FROM \`${vista}\` ve
            WHERE ve.ID_Asignatura = ?
              AND ve.ID_Estudiante = ?
              AND ve.Anio = ?
              AND ve.Semestre = ?
            GROUP BY ve.Competencia
            ORDER BY ve.Competencia
          `;

          return connection.query(fallbackSql, [asignatura, alumno, year, sem], (err2, rows2) => {
            if (err2) {
              console.error('[GraficosRadar] ❌ Error también en consulta simplificada:', err2.message);
              return res.status(500).json({
                error: 'Error al obtener datos del radar',
                detalle: err2.message
              });
            }

            if (!rows2 || rows2.length === 0) {
              console.warn('[GraficosRadar] ⚠️ No se encontraron datos (consulta simplificada)');
              return res.status(404).json({
                error: 'Sin datos para el gráfico radar',
                mensaje: 'El alumno no tiene competencias registradas para los filtros seleccionados.',
                filtros: { asignatura, alumno, anio: year, semestre: sem, nivel: vista }
              });
            }

            // Si es nivel competencia, completar con las 8 competencias
            if (nivel !== 'fase') {
              return completarConTodasLasCompetencias(rows2, (datosCompletos) => {
                console.log(`[GraficosRadar] ✅ Datos obtenidos (fallback+completo): ${datosCompletos.length} competencias`);
                return res.json({ mensajeRango, nivel: vista, datos: datosCompletos });
              });
            }

            console.log(`[GraficosRadar] ✅ Datos obtenidos (fallback): ${rows2.length} competencias`);
            return res.json({ mensajeRango, nivel: vista, datos: rows2 });
          });
        }

        return res.status(500).json({
          error: 'Error al obtener datos del radar',
          detalle: err.message
        });
      }

      if (!rows || rows.length === 0) {
        // Si es nivel competencia y no hay datos, devolver las 8 competencias todas en 0
        return completarConTodasLasCompetencias([], (datosCompletos) => {
          console.log(`[GraficosRadar] ✅ Sin evaluaciones — devolviendo ${datosCompletos.length} competencias en 0`);
          return res.json({ mensajeRango, nivel: vista, datos: datosCompletos });
        });
      }

      // Si es nivel competencia, completar con las 8 competencias (las sin datos = 0)
      if (nivel !== 'fase') {
        return completarConTodasLasCompetencias(rows, (datosCompletos) => {
          console.log(`[GraficosRadar] ✅ ${datosCompletos.length} competencias totales (${vista})`);
          return res.json({ mensajeRango, nivel: vista, datos: datosCompletos });
        });
      }

      console.log(`[GraficosRadar] ✅ Datos obtenidos exitosamente: ${rows.length} fases (${vista})`);
      res.json({ mensajeRango, nivel: vista, datos: rows });
    });
  });
});


/**
 * ========================================
 * 2️⃣ GRÁFICO BARRAS - Alumno vs Promedio
 * ========================================
 */
router.get('/barras', async (req, res) => {
  const { asignatura, alumno, anio, semestre } = req.query;

  if (!asignatura || !alumno || !anio || !semestre) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos: asignatura, alumno, anio, semestre' });
  }

  console.log('[Graficos] 📡 Barras solicitadas:', { asignatura, alumno, anio, semestre });

  if (alumno === ALUMNO_CURSO) {
    try {
      const [umbralRows] = await connection.promise().query(
        `SELECT Umbral FROM asignatura WHERE ID_Asignatura = ?`,
        [asignatura]
      );
      const umbral = umbralRows[0]?.Umbral ?? 51;

      const [rowsCurso] = await connection.promise().query(`
        SELECT competencia,
          ROUND(SUM(CASE WHEN promedio_estudiante >= ? THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS porcentaje_cumple,
          SUM(CASE WHEN promedio_estudiante >= ? THEN 1 ELSE 0 END) AS num_cumple,
          COUNT(*) AS total_alumnos
        FROM (
          SELECT ID_Estudiante, Competencia AS competencia, AVG(Porcentaje_Logro) AS promedio_estudiante
          FROM vw_logro_estudiante
          WHERE ID_Asignatura = ? AND Anio = ? AND Semestre = ?
          GROUP BY ID_Estudiante, Competencia
        ) sub
        GROUP BY competencia
        ORDER BY competencia
      `, [umbral, umbral, asignatura, anio, semestre]);

      const labelsCurso = rowsCurso.map(r => r.competencia);
      const porcentajesCurso = rowsCurso.map(r => r.porcentaje_cumple ?? 0);
      const numCumpleCurso = rowsCurso.map(r => Number(r.num_cumple) || 0);
      const totalCurso = rowsCurso.map(r => Number(r.total_alumnos) || 0);
      const numNoCumpleCurso = rowsCurso.map((r, i) => totalCurso[i] - numCumpleCurso[i]);

      return res.json({
        labels: labelsCurso,
        series: [
          { name: '% Alumnos que cumplen umbral', values: porcentajesCurso }
        ],
        extra: {
          numCumple: numCumpleCurso,
          numNoCumple: numNoCumpleCurso,
          total: totalCurso
        },
        modo: 'curso',
        umbral
      });
    } catch (errorCurso) {
      console.error('[Graficos] ❌ Error en /barras (curso):', errorCurso);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  try {
    const [rows] = await connection.promise().query(`
      SELECT
        comp.Competencia                              AS competencia,
        ROUND(AVG(comp.Porcentaje_Logro_Comp), 1)    AS logro_promedio,
        ROUND(AVG(est.Porcentaje_Logro), 1)          AS logro_alumno
      FROM vw_logro_competencia comp
      LEFT JOIN vw_logro_estudiante est
        ON  est.Competencia   = comp.Competencia
        AND est.ID_Asignatura = comp.ID_Asignatura
        AND est.Anio          = comp.Anio
        AND est.Semestre      = comp.Semestre
        AND est.ID_Estudiante = ?
      WHERE comp.ID_Asignatura = ?
        AND comp.Anio          = ?
        AND comp.Semestre      = ?
      GROUP BY comp.Competencia
      ORDER BY comp.Competencia
    `, [alumno, asignatura, anio, semestre]);

    console.log('[Graficos] ✅ Filas obtenidas:', rows.length);

    const labels         = rows.map(r => r.competencia);
    const promedioValues = rows.map(r => r.logro_promedio ?? 0);
    const alumnoValues   = rows.map(r => r.logro_alumno  ?? 0);

    res.json({
      labels,
      series: [
        { name: 'Promedio General', values: promedioValues },
        { name: 'Alumno',           values: alumnoValues   }
      ]
    });

  } catch (error) {
    console.error('[Graficos] ❌ Error en /barras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/**
 * ========================================
 * 3️⃣ GRÁFICO BURBUJAS - Competencias vs Brecha
 * ========================================
 */
router.get('/burbujas', async (req, res) => {
  const { asignatura, alumno, anio, semestre } = req.query;

  if (!asignatura || !alumno || !anio || !semestre) {
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['asignatura', 'alumno', 'anio', 'semestre']
    });
  }

  console.log(`[Graficos] 📡 Burbujas - Asignatura: ${asignatura}, Alumno: ${alumno}, Año: ${anio}, Semestre: ${semestre}`);

  try {
    const [umbralRows] = await connection.promise().query(
      `SELECT Umbral FROM asignatura WHERE ID_Asignatura = ?`,
      [asignatura]
    );
    const umbral = umbralRows[0]?.Umbral ?? 51; // fallback a 51 si por algún motivo no existe

    if (alumno === ALUMNO_CURSO) {
      const sqlCurso = `
        SELECT 
          comp.Competencia AS nombre,
          ROUND(AVG(comp.Porcentaje_Logro_Comp), 1) AS logro,
          ROUND(AVG(comp.Porcentaje_Logro_Comp), 1) - ? AS distancia_umbral,
          (
            SELECT COUNT(DISTINCT ind.ID_Indicador)
            FROM indicador ind
            JOIN ra_competencia rc2 ON rc2.ra_ID_RA = ind.ra_ID_RA
            JOIN contenido cont ON cont.ID_Contenido = ind.contenido_ID_Contenido
            WHERE cont.asignatura_ID_Asignatura = comp.ID_Asignatura
              AND rc2.competencia_ID_Competencia = SUBSTRING_INDEX(comp.Competencia, ' · ', 1)
          ) AS peso_curricular
        FROM vw_logro_competencia comp
        WHERE comp.ID_Asignatura = ? AND comp.Anio = ? AND comp.Semestre = ?
        GROUP BY comp.Competencia, comp.ID_Asignatura
        ORDER BY comp.Competencia
      `;
      const [rowsCurso] = await connection.promise().query(sqlCurso, [umbral, asignatura, anio, semestre]);
      const formattedCurso = rowsCurso.map(r => ({
        competencia: r.nombre,
        x: r.logro,
        y: r.distancia_umbral,
        r: r.peso_curricular || 1,
        cumpleUmbral: r.logro >= umbral
      }));
      console.log(`[Graficos] ✅ Burbujas Curso - ${formattedCurso.length} competencias procesadas (umbral=${umbral})`);
      return res.json({ items: formattedCurso, umbral });
    }

    const sql = `
      SELECT 
        ve.Competencia AS nombre,
        ROUND(AVG(ve.Porcentaje_Logro), 1) AS logro,
        ROUND(AVG(ve.Porcentaje_Logro), 1) - ? AS distancia_umbral,
        (
          SELECT COUNT(DISTINCT ind.ID_Indicador)
          FROM indicador ind
          JOIN ra_competencia rc2 ON rc2.ra_ID_RA = ind.ra_ID_RA
          JOIN contenido cont ON cont.ID_Contenido = ind.contenido_ID_Contenido
          WHERE cont.asignatura_ID_Asignatura = ve.ID_Asignatura
            AND rc2.competencia_ID_Competencia = SUBSTRING_INDEX(ve.Competencia, ' · ', 1)
        ) AS peso_curricular
      FROM vw_logro_estudiante ve
      WHERE ve.ID_Asignatura = ? AND ve.ID_Estudiante = ? AND ve.Anio = ? AND ve.Semestre = ?
      GROUP BY ve.Competencia, ve.ID_Asignatura
      ORDER BY ve.Competencia
    `;

    const [rows] = await connection.promise().query(sql, [umbral, asignatura, alumno, anio, semestre]);

    const formatted = rows.map(r => ({
      competencia: r.nombre,
      x: r.logro,
      y: r.distancia_umbral,
      r: r.peso_curricular || 1,
      cumpleUmbral: r.logro >= umbral
    }));

    console.log(`[Graficos] ✅ Burbujas - ${formatted.length} competencias procesadas (umbral=${umbral})`);
    res.json({ items: formatted, umbral });
  } catch (err) {
    console.error('[Graficos] ❌ Error en gráfico burbujas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


/**
 * ========================================
 * 4️⃣ GRÁFICO HEATMAP - Estudiantes vs Competencias
 * ========================================
 */
router.get('/heatmap', (req, res) => {
  const { asignatura, anio, semestre } = req.query;

  console.log('[GraficosHeatmap] 📡 Parámetros recibidos:', { asignatura, anio, semestre });

  if (!asignatura || !anio || !semestre) {
    console.warn('[GraficosHeatmap] ⚠️ Parámetros faltantes');
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['asignatura', 'anio', 'semestre'],
      recibidos: { asignatura, anio, semestre }
    });
  }

  const year = parseInt(anio, 10);
  const sem  = parseInt(semestre, 10);

  if (Number.isNaN(year) || Number.isNaN(sem)) {
    console.warn('[GraficosHeatmap] ⚠️ Año o semestre no numéricos:', { anio, semestre });
    return res.status(400).json({
      error: 'anio y semestre deben ser numéricos',
      recibidos: { anio, semestre }
    });
  }

  console.log('[GraficosHeatmap] ✅ Validación OK');

  const sql = `
    SELECT 
      ve.ID_Estudiante AS estudiante,
      CONCAT(e.Apellido, ' ', e.Nombre) AS nombre_estudiante,
      ve.Competencia AS competencia,
      ROUND(AVG(ve.Porcentaje_Logro), 1) AS logro
    FROM vw_logro_estudiante ve
    JOIN estudiante e ON e.ID_Estudiante = ve.ID_Estudiante
    WHERE ve.ID_Asignatura = ?
      AND ve.Anio = ?
      AND ve.Semestre = ?
    GROUP BY ve.ID_Estudiante, e.Apellido, e.Nombre, ve.Competencia
    ORDER BY e.Apellido, e.Nombre, ve.Competencia
  `;

  console.log('[GraficosHeatmap] 🧗 SQL a ejecutar con valores:', [asignatura, year, sem]);

  connection.query(sql, [asignatura, year, sem], (err, rows) => {
    if (err) {
      console.error('[GraficosHeatmap] ❌ Error en consulta SQL:', err.message);
      return res.status(500).json({
        error: 'Error al obtener datos del heatmap',
        detalle: err.message
      });
    }

    if (!rows || rows.length === 0) {
      console.warn('[GraficosHeatmap] ⚠️ No se encontraron datos para los parámetros proporcionados');
      return res.status(404).json({
        error: 'Sin datos para el heatmap',
        mensaje: 'No hay registros de logro para la asignatura y período indicados.',
        filtros: { asignatura, anio: year, semestre: sem }
      });
    }

    console.log(`[GraficosHeatmap] ✅ Datos obtenidos exitosamente: ${rows.length} registros`);
    res.json(rows);
  });
});


/**
 * ========================================
 * 5️⃣ GRÁFICO HEATMAP CURSO - Asignatura + sus Alumnos x Competencia
 * ========================================
 * Fila 1: promedio de la asignatura completa por competencia.
 * Filas siguientes: cada alumno inscrito (activo) en esa asignatura+año+semestre,
 * con su logro individual por competencia.
 */
router.get('/heatmap-curso', async (req, res) => {
  const { asignatura, anio, semestre } = req.query;

  console.log('[GraficosHeatmapCurso] 📡 Parámetros recibidos:', { asignatura, anio, semestre });

  if (!asignatura || !anio || !semestre) {
    console.warn('[GraficosHeatmapCurso] ⚠️ Parámetros faltantes');
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['asignatura', 'anio', 'semestre'],
      recibidos: { asignatura, anio, semestre }
    });
  }

  const year = parseInt(anio, 10);
  const sem = parseInt(semestre, 10);

  if (Number.isNaN(year) || Number.isNaN(sem)) {
    return res.status(400).json({
      error: 'anio y semestre deben ser numéricos',
      recibidos: { anio, semestre }
    });
  }

  try {
    // CONSULTA 1: Qué competencias mide esta asignatura (cobertura curricular)
    const [cobertura] = await connection.promise().query(`
      SELECT DISTINCT c.ID_Competencia AS competencia
      FROM indicador ind
      JOIN ra_competencia rc ON rc.ra_ID_RA = ind.ra_ID_RA
      JOIN competencia c ON c.ID_Competencia = rc.competencia_ID_Competencia
      JOIN contenido cont ON cont.ID_Contenido = ind.contenido_ID_Contenido
      WHERE cont.asignatura_ID_Asignatura = ?
    `, [asignatura]);

    if (!cobertura || cobertura.length === 0) {
      return res.status(404).json({
        error: 'Sin cobertura',
        mensaje: 'Esta asignatura no tiene indicadores vinculados a ninguna competencia.'
      });
    }

    const competenciasCubiertas = new Set(cobertura.map(c => c.competencia));

    // CONSULTA 2: Las 8 competencias fijas del perfil de egreso (columnas fijas)
    const [competenciasTodas] = await connection.promise().query(`
      SELECT ID_Competencia AS codigo FROM competencia ORDER BY ID_Competencia
    `);
    const listaCompetencias = competenciasTodas.map(c => c.codigo);

    // CONSULTA 3: Promedio de la asignatura completa por competencia
    const [logrosAsignatura] = await connection.promise().query(`
      SELECT SUBSTRING_INDEX(comp.Competencia, ' · ', 1) AS competencia,
             ROUND(AVG(comp.Porcentaje_Logro_Comp), 1) AS logro
      FROM vw_logro_competencia comp
      WHERE comp.ID_Asignatura = ? AND comp.Anio = ? AND comp.Semestre = ?
      GROUP BY SUBSTRING_INDEX(comp.Competencia, ' · ', 1)
    `, [asignatura, year, sem]);

    const mapaLogroAsignatura = new Map(logrosAsignatura.map(r => [r.competencia, r.logro]));

    // CONSULTA 4: Alumnos inscritos (activos) en esta asignatura+año+semestre
    const [alumnos] = await connection.promise().query(`
      SELECT DISTINCT e.ID_Estudiante AS id, e.Nombre AS nombre, e.Apellido AS apellido
      FROM inscripcion insc
      JOIN estudiante e ON e.ID_Estudiante = insc.estudiante_ID_Estudiante
      WHERE insc.asignatura_ID_Asignatura = ?
        AND insc.Anio = ?
        AND insc.Semestre = ?
        AND insc.Estado = 'Activo'
      ORDER BY e.Apellido, e.Nombre
    `, [asignatura, year, sem]);

    if (!alumnos || alumnos.length === 0) {
      return res.status(404).json({
        error: 'Sin alumnos',
        mensaje: 'No hay alumnos inscritos en esta asignatura para el año y semestre indicados.'
      });
    }

    // CONSULTA 5: Logro individual por alumno y competencia
    const [logrosAlumnos] = await connection.promise().query(`
      SELECT ve.ID_Estudiante AS estudiante,
             SUBSTRING_INDEX(ve.Competencia, ' · ', 1) AS competencia,
             ROUND(AVG(ve.Porcentaje_Logro), 1) AS logro
      FROM vw_logro_estudiante ve
      WHERE ve.ID_Asignatura = ? AND ve.Anio = ? AND ve.Semestre = ?
      GROUP BY ve.ID_Estudiante, SUBSTRING_INDEX(ve.Competencia, ' · ', 1)
    `, [asignatura, year, sem]);

    const mapaLogroAlumno = new Map();
    logrosAlumnos.forEach(r => {
      mapaLogroAlumno.set(`${r.estudiante}_${r.competencia}`, r.logro);
    });

    // Construir la matriz de filas: fila 1 = asignatura, resto = alumnos
    const construirFila = (label, esAsignatura, idAlumno) => {
      const valores = {};
      listaCompetencias.forEach(comp => {
        if (!competenciasCubiertas.has(comp)) {
          valores[comp] = { estado: 'no_aplica', logro: null };
          return;
        }
        const logro = esAsignatura
          ? mapaLogroAsignatura.get(comp)
          : mapaLogroAlumno.get(`${idAlumno}_${comp}`);
        valores[comp] = logro !== undefined
          ? { estado: 'con_datos', logro }
          : { estado: 'sin_evaluar', logro: null };
      });
      return { label, tipo: esAsignatura ? 'asignatura' : 'alumno', valores };
    };

    const filas = [
      construirFila(asignatura, true, null),
      ...alumnos.map(a => construirFila(`${a.apellido} ${a.nombre}`, false, a.id))
    ];

    console.log(`[GraficosHeatmapCurso] ✅ ${filas.length} filas (1 asignatura + ${alumnos.length} alumnos) x ${listaCompetencias.length} competencias`);

    res.json({
      asignatura,
      competencias: listaCompetencias,
      filas
    });

  } catch (error) {
    console.error('[GraficosHeatmapCurso] ❌ Error:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
});


/**
 * GRÁFICO DE LÍNEAS - Trayectoria académica del alumno por competencia
 */
router.get('/lineas', (req, res) => {
  const { alumno } = req.query;

  if (!alumno) {
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['alumno']
    });
  }

  console.log('[Trayectoria] 📡 Alumno:', alumno);

  const sql = `
    SELECT
      insc.asignatura_ID_Asignatura                           AS asignatura,
      insc.Semestre                                           AS semestre,
      CONCAT(c.ID_Competencia, ' · ', TRIM(c.Nombre))         AS competencia,
      ROUND(AVG(ap.Obtenido / ind.Puntaje_Max * 100), 1)      AS logro
    FROM aplicacion ap
    JOIN inscripcion    insc ON insc.ID_Inscripcion     = ap.inscripcion_ID_Inscripcion
    JOIN indicador      ind  ON ind.ID_Indicador        = ap.indicador_ID_Indicador
    JOIN ra_competencia rc   ON rc.ra_ID_RA             = ind.ra_ID_RA
    JOIN competencia    c    ON c.ID_Competencia        = rc.competencia_ID_Competencia
    WHERE insc.estudiante_ID_Estudiante = ?
      AND ind.Puntaje_Max > 0
    GROUP BY
      insc.asignatura_ID_Asignatura,
      insc.Semestre,
      c.ID_Competencia,
      c.Nombre
    ORDER BY insc.Semestre, c.ID_Competencia
  `;

  connection.query(sql, [alumno], (err, rows) => {
    if (err) {
      console.error('[Trayectoria] ❌ Error:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        error: 'Sin datos',
        mensaje: 'No hay datos de trayectoria para este alumno.'
      });
    }
    console.log(`[Trayectoria] ✅ ${rows.length} registros devueltos`);
    res.json(rows);
  });
});

/**
 * TABLA DE DISTRIBUCIÓN POR TRAMO - Competencias del Perfil de Egreso
 * Clasifica el logro en 3 tramos: Deficiente (0-50%), Suficiente (51-74%),
 * Satisfactorio (75-100%). En modo alumno, la población son sus notas
 * individuales; en modo curso, la población son los alumnos inscritos.
 */
router.get('/distribucion-tramos', async (req, res) => {
  const { asignatura, alumno, anio, semestre } = req.query;

  if (!asignatura || !anio || !semestre) {
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['asignatura', 'anio', 'semestre']
    });
  }

  console.log('[DistribucionTramos] 📡 Parámetros:', { asignatura, alumno, anio, semestre });

  try {
    if (alumno === ALUMNO_CURSO) {
      const [rowsCurso] = await connection.promise().query(`
        SELECT competencia,
          ROUND(SUM(CASE WHEN promedio_estudiante >= 75 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS satisfactorio,
          ROUND(SUM(CASE WHEN promedio_estudiante BETWEEN 51 AND 74.99 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS suficiente,
          ROUND(SUM(CASE WHEN promedio_estudiante < 51 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS deficiente
        FROM (
          SELECT ID_Estudiante, SUBSTRING_INDEX(Competencia, ' · ', 1) AS competencia, AVG(Porcentaje_Logro) AS promedio_estudiante
          FROM vw_logro_estudiante
          WHERE ID_Asignatura = ? AND Anio = ? AND Semestre = ?
          GROUP BY ID_Estudiante, SUBSTRING_INDEX(Competencia, ' · ', 1)
        ) sub
        GROUP BY competencia
        ORDER BY competencia
      `, [asignatura, anio, semestre]);

      if (!rowsCurso || rowsCurso.length === 0) {
        return res.status(404).json({ error: 'Sin datos', mensaje: 'No hay datos suficientes para esta asignatura.' });
      }
      console.log(`[DistribucionTramos] ✅ Curso: ${rowsCurso.length} competencias`);
      return res.json({ modo: 'curso', filas: rowsCurso });
    }

    const [rowsAlumno] = await connection.promise().query(`
      SELECT
        c.ID_Competencia AS competencia,
        ROUND(SUM(CASE WHEN (ap.Obtenido/ind.Puntaje_Max*100) >= 75 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS satisfactorio,
        ROUND(SUM(CASE WHEN (ap.Obtenido/ind.Puntaje_Max*100) BETWEEN 51 AND 74.99 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS suficiente,
        ROUND(SUM(CASE WHEN (ap.Obtenido/ind.Puntaje_Max*100) < 51 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) AS deficiente
      FROM aplicacion ap
      JOIN inscripcion insc ON insc.ID_Inscripcion = ap.inscripcion_ID_Inscripcion
      JOIN indicador ind ON ind.ID_Indicador = ap.indicador_ID_Indicador
      JOIN ra_competencia rc ON rc.ra_ID_RA = ind.ra_ID_RA
      JOIN competencia c ON c.ID_Competencia = rc.competencia_ID_Competencia
      WHERE insc.estudiante_ID_Estudiante = ?
        AND insc.asignatura_ID_Asignatura = ?
        AND insc.Anio = ?
        AND insc.Semestre = ?
        AND ind.Puntaje_Max > 0
      GROUP BY c.ID_Competencia
      ORDER BY c.ID_Competencia
    `, [alumno, asignatura, anio, semestre]);

    if (!rowsAlumno || rowsAlumno.length === 0) {
      return res.status(404).json({ error: 'Sin datos', mensaje: 'No hay evaluaciones registradas para este alumno en esta asignatura.' });
    }
    console.log(`[DistribucionTramos] ✅ Alumno: ${rowsAlumno.length} competencias`);
    return res.json({ modo: 'alumno', filas: rowsAlumno });

  } catch (error) {
    console.error('[DistribucionTramos] ❌ Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
});

/**
 * GRÁFICO DE LÍNEAS - Evolución por Evaluación (dentro de una asignatura)
 */
router.get('/evolucion-evaluacion', (req, res) => {
  const { asignatura, alumno, anio, semestre } = req.query;

  if (!asignatura || !alumno || !anio || !semestre) {
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['asignatura', 'alumno', 'anio', 'semestre']
    });
  }

  console.log('[EvolucionEvaluacion] 📡 Parámetros:', { asignatura, alumno, anio, semestre });

  if (alumno === ALUMNO_CURSO) {
    const sqlCurso = `
      SELECT
        ev.ID_Evaluacion                                        AS evaluacionId,
        ev.Nombre                                                AS evaluacionNombre,
        ev.N_Instancia                                           AS orden,
        CONCAT(c.ID_Competencia, ' · ', TRIM(c.Nombre))         AS competencia,
        ROUND(AVG(ap.Obtenido / ind.Puntaje_Max * 100), 1)      AS logro
      FROM aplicacion ap
      JOIN inscripcion    insc ON insc.ID_Inscripcion     = ap.inscripcion_ID_Inscripcion
      JOIN evaluacion     ev   ON ev.ID_Evaluacion         = ap.evaluacion_ID_Evaluacion
      JOIN indicador      ind  ON ind.ID_Indicador         = ap.indicador_ID_Indicador
      JOIN ra_competencia rc   ON rc.ra_ID_RA              = ind.ra_ID_RA
      JOIN competencia    c    ON c.ID_Competencia         = rc.competencia_ID_Competencia
      WHERE insc.asignatura_ID_Asignatura = ?
        AND insc.Anio = ?
        AND insc.Semestre = ?
        AND ind.Puntaje_Max > 0
      GROUP BY ev.ID_Evaluacion, ev.Nombre, ev.N_Instancia, c.ID_Competencia, c.Nombre
      ORDER BY ev.N_Instancia, c.ID_Competencia
    `;
    connection.query(sqlCurso, [asignatura, anio, semestre], (errCurso, rowsCurso) => {
      if (errCurso) {
        console.error('[EvolucionEvaluacion] ❌ Error en consulta curso:', errCurso.message);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      if (!rowsCurso || rowsCurso.length === 0) {
        return res.status(404).json({
          error: 'Sin datos',
          mensaje: 'No hay evaluaciones registradas para esta asignatura en el período indicado.'
        });
      }
      console.log(`[EvolucionEvaluacion] ✅ Curso: ${rowsCurso.length} registros devueltos`);
      return res.json(rowsCurso);
    });
    return;
  }

  const sql = `
    SELECT
      ev.ID_Evaluacion                                        AS evaluacionId,
      ev.Nombre                                                AS evaluacionNombre,
      ev.N_Instancia                                           AS orden,
      CONCAT(c.ID_Competencia, ' · ', TRIM(c.Nombre))         AS competencia,
      ROUND(AVG(ap.Obtenido / ind.Puntaje_Max * 100), 1)      AS logro
    FROM aplicacion ap
    JOIN inscripcion    insc ON insc.ID_Inscripcion     = ap.inscripcion_ID_Inscripcion
    JOIN evaluacion     ev   ON ev.ID_Evaluacion         = ap.evaluacion_ID_Evaluacion
    JOIN indicador      ind  ON ind.ID_Indicador         = ap.indicador_ID_Indicador
    JOIN ra_competencia rc   ON rc.ra_ID_RA              = ind.ra_ID_RA
    JOIN competencia    c    ON c.ID_Competencia         = rc.competencia_ID_Competencia
    WHERE insc.estudiante_ID_Estudiante = ?
      AND insc.asignatura_ID_Asignatura = ?
      AND insc.Anio = ?
      AND insc.Semestre = ?
      AND ind.Puntaje_Max > 0
    GROUP BY ev.ID_Evaluacion, ev.Nombre, ev.N_Instancia, c.ID_Competencia, c.Nombre
    ORDER BY ev.N_Instancia, c.ID_Competencia
  `;

  connection.query(sql, [alumno, asignatura, anio, semestre], (err, rows) => {
    if (err) {
      console.error('[EvolucionEvaluacion] ❌ Error:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        error: 'Sin datos',
        mensaje: 'No hay evaluaciones registradas para este alumno en esta asignatura.'
      });
    }
    console.log(`[EvolucionEvaluacion] ✅ ${rows.length} registros devueltos`);
    res.json(rows);
  });
});

/**
 * ========================================
 * 6️⃣ ENDPOINT DE PRUEBA
 * ========================================
 */
router.get('/test', (req, res) => {

  res.json({
    message: '✅ Módulo de gráficos funcionando correctamente',
    endpoints: [
      'GET /api/graficos/radar?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8&nivel=competencia',
      'GET /api/graficos/radar?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8&nivel=fase',
      'GET /api/graficos/barras?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8',
      'GET /api/graficos/burbujas?asignatura=TIS800&alumno=20268128K&anio=2025&semestre=8',
      'GET /api/graficos/heatmap?asignatura=TIS800&anio=2025&semestre=8',
      'GET /api/graficos/lineas?asignatura=TIS800&anio=2025&semestre=8'
    ]
  });
});


module.exports = router;