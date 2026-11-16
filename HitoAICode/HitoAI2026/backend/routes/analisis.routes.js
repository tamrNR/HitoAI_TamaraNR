// ===============================
// routes/analisis.routes.js
// ===============================
const express = require('express');
const router = express.Router();
const connection = require('../db/connection');
const { generarAnalisisIA, obtenerAnalisisPorId } = require('../controllers/analisisIA.controller');
const calcularNivel = require('../utils/calcularNivel');
const { verifyAuth, authorizeRoles, scopeAsignatura } = require('../middleware/auth.middleware');
const { iaLimiter } = require('../middleware/rateLimit.middleware');

const ROLES_ANALITICA = ['Administrador', 'Jefe de Carrera', 'Comité Curricular', 'Decano'];
const scopeQueryAsignatura = scopeAsignatura((req) => req.query.asignatura);

router.use(verifyAuth);
router.use(authorizeRoles(...ROLES_ANALITICA));

// =========================================
// 1. ANÁLISIS POR CURSO / COHORTE
// Ejemplo: /api/analisis/curso?asignatura=TIS800&anio=2025&semestre=8
// =========================================
router.get('/curso', scopeQueryAsignatura, (req, res) => {
  const { asignatura, anio, semestre } = req.query;

  if (!asignatura || !anio || !semestre) {
    return res.status(400).json({ error: 'Faltan parámetros: asignatura, anio o semestre.' });
  }

  const sqlCompetencias = `
    SELECT
      Competencia,
      Porcentaje_Logro_Comp
    FROM vw_logro_competencia
    WHERE ID_Asignatura = ? AND Anio = ? AND Semestre = ?
    ORDER BY Competencia;
  `;

  const sqlRAs = `
    SELECT
      RA,
      Porcentaje_Logro_RA
    FROM vw_logro_ra
    WHERE ID_Asignatura = ? AND Anio = ? AND Semestre = ?
    ORDER BY RA;
  `;

  connection.query(sqlCompetencias, [asignatura, anio, semestre], (err, competencias) => {
    if (err) {
      console.error('[AnalisisCurso] Error en consulta Competencias:', err?.message || err);
      return res.status(500).json({ error: 'Error al obtener Competencias' });
    }

    // Temporalmente comentado para aislar el error
    /*
    connection.query(sqlRAs, [asignatura, anio, semestre], (err, ras) => {
      if (err) {
        console.error('[AnalisisCurso] Error en consulta RAs:', err);
        return res.status(500).json({ error: 'Error al obtener Resultados de Aprendizaje' });
      }

      const procesar = (arr, key) =>
        arr.map(r => ({
          ID_Competencia: r.ID_Competencia || null,
          Competencia: r.Competencia,
          ID_Evaluacion: r.ID_Evaluacion || null,
          Evaluacion: r.Evaluacion || null,
          [key]: r[key],
          Nivel: calcularNivel(r[key]),
          Brecha: +(100 - Number(r[key])).toFixed(1)
        }));

      res.json({
        competencias: procesar(competencias, 'Porcentaje_Logro_Comp'),
        ras: procesar(ras, 'Porcentaje_Logro_RA')
      });
    });
    */

    const procesar = (arr, key) =>
      arr.map(r => ({
        ID_Competencia: r.ID_Competencia || null,
        Competencia: r.Competencia,
        ID_Evaluacion: r.ID_Evaluacion || null,
        Evaluacion: r.Evaluacion || null,
        [key]: r[key],
        Nivel: calcularNivel(r[key]),
        Brecha: +(100 - Number(r[key])).toFixed(1)
      }));

    res.json({
      competencias: procesar(competencias, 'Porcentaje_Logro_Comp'),
      ras: []
    });
  });
});

// =========================================
// 2. ANÁLISIS POR ESTUDIANTE
// Ejemplo: /api/analisis/estudiante?asignatura=TIS800&anio=2025&semestre=8&estudiante=20268128K
// =========================================
router.get('/estudiante', scopeQueryAsignatura, (req, res) => {
  const { asignatura, anio, semestre, estudiante } = req.query;

  if (!asignatura || !anio || !semestre || !estudiante) {
    return res.status(400).json({ error: 'Faltan parámetros: asignatura, anio, semestre o estudiante.' });
  }

  const params = [
    String(asignatura).trim(),
    String(anio).trim(),
    String(semestre).trim(),
    String(estudiante).trim()
  ];

  const sql = `
    SELECT ID_Estudiante, Estudiante, ID_Evaluacion, Evaluacion,
           ID_RA, RA, ID_Competencia, Competencia, Porcentaje_Logro
    FROM vw_logro_estudiante
    WHERE CAST(ID_Asignatura AS CHAR) = ?
      AND CAST(Anio AS CHAR) = ?
      AND CAST(Semestre AS CHAR) = ?
      AND CAST(ID_Estudiante AS CHAR) = ?
    ORDER BY RA;
  `;

  connection.query(sql, params, (err, rows) => {
    if (err) {
      console.error('❌ Error en consulta Estudiante:', err?.message || err);
      return res.status(500).json({ error: 'Error al obtener datos del estudiante' });
    }

    if (!rows.length) {
      return res.json([]);
    }

    const data = rows.map(r => ({
      ...r,
      Nivel: calcularNivel(r.Porcentaje_Logro),
      Brecha: +(100 - Number(r.Porcentaje_Logro)).toFixed(1)
    }));

    res.json(data);
  });
});

// =========================================
// 3. ANÁLISIS CON IA A PARTIR DE DATOS DE GRÁFICO
// POST /api/analisis/ia
// =========================================
router.post('/ia', iaLimiter,
  scopeAsignatura((req) => req.body?.context?.asignatura ?? req.body?.asignatura),
  generarAnalisisIA);

// =========================================
// 4. OBTENER ANÁLISIS POR ID
// GET /api/analisis/:id
// =========================================
router.get('/:id', obtenerAnalisisPorId);

module.exports = router;
