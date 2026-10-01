// ===============================================
// Rutas para filtros del módulo de Analítica
// ===============================================
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// ✅ GET /api/analitica/carreras - Obtener todas las carreras
router.get('/carreras', async (req, res) => {
  console.log('[AnaliticaFiltros] 📡 GET /carreras');
  const sql = `
    SELECT 
      ID_Carrera as id,
      Nombre as nombre
    FROM carrera
    ORDER BY Nombre
  `;
  try {
    const [rows] = await pool.query(sql);
    const out = Array.isArray(rows) ? rows : [];
    console.log('[AnaliticaFiltros] ✅ Carreras obtenidas:', out.length);
    return res.json(out);
  } catch (err) {
    console.error('[AnaliticaFiltros] ❌ Error al obtener carreras:', err);
    return res.status(500).json({ error: 'Error al obtener carreras' });
  }
});

// ✅ GET /api/analitica/planes?carrera={id} - Obtener planes de una carrera
router.get('/planes', async (req, res) => {
  const { carrera } = req.query;
  console.log('[AnaliticaFiltros] 📡 GET /planes - Carrera:', carrera);
  if (!carrera) {
    return res.status(400).json({ error: 'Parámetro carrera requerido' });
  }
  const sql = `
    SELECT DISTINCT
      Plan_Academico AS id,
      CONCAT('Plan ', Plan_Academico) AS nombre
    FROM asignatura
    WHERE carrera_ID_Carrera = ?
    ORDER BY Plan_Academico DESC
  `;
  try {
    const [rows] = await pool.query(sql, [carrera]);
    const out = Array.isArray(rows) ? rows : [];
    console.log('[AnaliticaFiltros] ✅ Planes obtenidos:', out.length);
    return res.json(out);
  } catch (err) {
    console.error('[AnaliticaFiltros] ❌ Error al obtener planes:', err);
    return res.status(500).json({ error: 'Error al obtener planes' });
  }
});

// ✅ GET /api/analitica/cohortes - Obtener cohortes disponibles
router.get('/cohortes', async (req, res) => {
  console.log('[AnaliticaFiltros] 📡 GET /cohortes');
  const sql = `
    SELECT DISTINCT i.Anio AS id, i.Anio AS nombre
    FROM inscripcion i
    WHERE i.Anio IS NOT NULL
      AND (i.Estado = 'Activo' OR i.Estado IS NULL)
    ORDER BY i.Anio DESC
  `;
  try {
    const [rows] = await pool.query(sql);
    const out = Array.isArray(rows) ? rows : [];
    console.log(`[AnaliticaFiltros] ✅ Cohortes obtenidas: ${out.length}`);
    return res.json(out);
  } catch (err) {
    console.error('[AnaliticaFiltros] ❌ Error al obtener cohortes:', err);
    return res.status(500).json({ error: 'Error al obtener cohortes' });
  }
});

// ✅ GET /api/analitica/semestres - Obtener semestres disponibles
router.get('/semestres', (req, res) => {
  console.log('[AnaliticaFiltros] 📡 GET /semestres');
  
  // Semestres del 1 al 10
  const semestres = [];
  for (let i = 1; i <= 10; i++) {
    semestres.push({
      id: i,
      nombre: `Semestre ${i}`
    });
  }
  
  console.log('[AnaliticaFiltros] ✅ Semestres generados:', semestres.length);
  res.json(semestres);
});

// ✅ GET /api/analitica/asignaturas?carrera={id}&plan={año} - Obtener asignaturas
router.get('/asignaturas', async (req, res, next) => {
  const carrera = req.query.carrera != null && req.query.carrera !== '' ? parseInt(req.query.carrera, 10) : null;
  const plan = req.query.plan != null && req.query.plan !== '' ? parseInt(req.query.plan, 10) : null;
  const semestre = req.query.semestre != null && req.query.semestre !== '' ? parseInt(req.query.semestre, 10) : null;
  console.log('[AnaliticaFiltros] 📡 GET /asignaturas', { carrera, plan, semestre });

  try {
    // Validación básica: requiere al menos plan; semestre opcional, carrera opcional
    if (plan === null || Number.isNaN(plan)) {
      return res.status(400).json({ error: 'Parámetro plan requerido y debe ser numérico' });
    }

    const where = ['a.Plan_Academico = ?'];
    const params = [plan];
    if (semestre !== null && !Number.isNaN(semestre)) {
      where.push('a.Semestre = ?');
      params.push(semestre);
    }
    if (carrera !== null && !Number.isNaN(carrera)) {
      where.push('a.carrera_ID_Carrera = ?');
      params.push(carrera);
    }
    where.push("(a.Estado = 'Activo' OR a.Estado IS NULL)");

    const sql = `
      SELECT 
        a.ID_Asignatura AS id,
        a.Nombre AS nombre
      FROM asignatura a
      WHERE ${where.join(' AND ')}
      ORDER BY a.Nombre
    `;

    const [rows] = await pool.query(sql, params);
    let out = Array.isArray(rows) ? rows : [];
    console.log(`[AnaliticaFiltros] ✅ Asignaturas obtenidas: ${out.length}`);
    return res.status(200).json(out);
  } catch (err) {
    console.error('[AnaliticaFiltros] ❌ Error en /asignaturas:', err);
    return res.status(500).json({ error: 'Error al obtener asignaturas' });
  }
});

// ✅ GET /api/analitica/alumnos?asignatura={id}&cohorte={año} - Obtener alumnos
router.get('/alumnos', async (req, res) => {
  const asignatura = String(req.query.asignatura || '').trim();
  const cohorte = parseInt(req.query.cohorte, 10);
  console.log('[AnaliticaFiltros] 📡 GET /alumnos - Asignatura:', asignatura, 'Cohorte:', cohorte);
  if (!asignatura || Number.isNaN(cohorte)) {
    return res.status(400).json({ error: 'Faltan parámetros válidos: asignatura y cohorte' });
  }
  const sql = `
    SELECT 
      e.ID_Estudiante AS id,
      CONCAT(e.Nombre, ' ', e.Apellido) AS nombre,
      i.Anio AS anio_inscripcion,
      i.Semestre AS semestre_inscripcion
    FROM inscripcion i
    JOIN estudiante e ON e.ID_Estudiante = i.estudiante_ID_Estudiante
    WHERE i.asignatura_ID_Asignatura = ?
      AND i.Anio = ?
      AND (i.Estado = 'Activo' OR i.Estado IS NULL)
    ORDER BY e.Apellido, e.Nombre
  `;
  try {
    const [rows] = await pool.query(sql, [asignatura, cohorte]);
    const out = Array.isArray(rows) ? rows : [];
    console.log(`[AnaliticaFiltros] ✅ Alumnos obtenidos: ${out.length}`);
    return res.json(out);
  } catch (err) {
    console.error('[AnaliticaFiltros] ❌ Error al obtener alumnos:', err);
    return res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});

module.exports = router;
