// ===============================================
// Panel de inicio - Comité Curricular
// GET /api/comite/dashboard?carrera=ID&plan=N
// ===============================================
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

router.get('/dashboard', async (req, res) => {
  console.log('[ComiteDashboard] 📡 GET /dashboard', req.query);
  try {
    const carrera = req.query.carrera != null && req.query.carrera !== ''
      ? parseInt(req.query.carrera, 10) : null;
    const plan = req.query.plan != null && req.query.plan !== ''
      ? parseInt(req.query.plan, 10) : null;

    // ---- Filtros ----
    const [carreras] = await pool.query(
      `SELECT ID_Carrera AS id, Nombre AS nombre FROM carrera ORDER BY Nombre`
    );

    let planesSql = `
      SELECT DISTINCT Plan_Academico AS id,
             CONCAT('Plan ', Plan_Academico) AS nombre
      FROM asignatura`;
    const planesParams = [];
    if (carrera && !Number.isNaN(carrera)) {
      planesSql += ` WHERE carrera_ID_Carrera = ?`;
      planesParams.push(carrera);
    }
    planesSql += ` ORDER BY Plan_Academico DESC`;
    const [planes] = await pool.query(planesSql, planesParams);

    const filtros = { carreras: carreras || [], planes: planes || [] };

    const vacio = {
      filtros,
      malla: [],
      cobertura: [],
      tributacion: []
    };

    if (!carrera || Number.isNaN(carrera)) {
      return res.json(vacio);
    }

    // Filtro de plan reutilizable (alias `a` = asignatura en todas las queries)
    const params = [carrera];
    let planFilter = '';
    if (plan && !Number.isNaN(plan)) {
      planFilter = ' AND a.Plan_Academico = ?';
      params.push(plan);
    }

    // ---- Malla curricular ----
    const [mallaRows] = await pool.query(`
      SELECT a.ID_Asignatura AS id,
             a.Nombre AS nombre,
             a.Semestre AS semestre,
             a.Plan_Academico AS plan,
             u.Nombre AS docente,
             COUNT(DISTINCT r.ID_RA)        AS n_ra,
             COUNT(DISTINCT c.ID_Contenido) AS n_contenidos,
             COUNT(DISTINCT i.ID_Indicador) AS n_indicadores
      FROM asignatura a
      LEFT JOIN usuario u ON u.ID_Usuario = a.usuario_ID_Usuario
      LEFT JOIN ra r ON r.asignatura_ID_Asignatura = a.ID_Asignatura
      LEFT JOIN contenido c ON c.asignatura_ID_Asignatura = a.ID_Asignatura
      LEFT JOIN indicador i ON i.contenido_ID_Contenido = c.ID_Contenido
      WHERE a.carrera_ID_Carrera = ? AND a.Estado = 'Activo' ${planFilter}
      GROUP BY a.ID_Asignatura, a.Nombre, a.Semestre, a.Plan_Academico, u.Nombre
      ORDER BY a.Semestre, a.Nombre
    `, params);

    const malla = (mallaRows || []).map(r => {
      const n_ra = Number(r.n_ra) || 0;
      const n_contenidos = Number(r.n_contenidos) || 0;
      const n_indicadores = Number(r.n_indicadores) || 0;
      let estado = 'completa';
      if (n_ra === 0) estado = 'sin_ra';
      else if (n_contenidos === 0) estado = 'sin_contenidos';
      else if (n_indicadores === 0) estado = 'sin_indicadores';
      return { ...r, n_ra, n_contenidos, n_indicadores, estado };
    });

    // ---- Cobertura de competencias ----
    // Carrera/plan/Estado en el ON del JOIN a asignatura para no perder
    // las competencias sin RA vinculado a la carrera/plan.
    const paramsCob = [carrera];
    let planFilterCob = '';
    if (plan && !Number.isNaN(plan)) {
      planFilterCob = ' AND a.Plan_Academico = ?';
      paramsCob.push(plan);
    }
    const [coberturaRows] = await pool.query(`
      SELECT comp.ID_Competencia AS id,
             comp.Nombre AS nombre,
             comp.Tipo AS tipo,
             COUNT(DISTINCT CASE WHEN a.ID_Asignatura IS NOT NULL THEN rc.ra_ID_RA END) AS n_ra,
             COUNT(DISTINCT a.ID_Asignatura) AS n_asignaturas
      FROM competencia comp
      LEFT JOIN ra_competencia rc ON rc.competencia_ID_Competencia = comp.ID_Competencia
      LEFT JOIN ra r ON r.ID_RA = rc.ra_ID_RA
      LEFT JOIN asignatura a
        ON a.ID_Asignatura = r.asignatura_ID_Asignatura
       AND a.carrera_ID_Carrera = ?
       AND a.Estado = 'Activo'
       ${planFilterCob}
      GROUP BY comp.ID_Competencia, comp.Nombre, comp.Tipo
      ORDER BY n_ra DESC, comp.Nombre
    `, paramsCob);

    const cobertura = (coberturaRows || []).map(r => ({
      ...r,
      n_ra: Number(r.n_ra) || 0,
      n_asignaturas: Number(r.n_asignaturas) || 0
    }));

    // ---- Tributación (filas; el front pivotea a matriz) ----
    const [tributacionRows] = await pool.query(`
      SELECT a.ID_Asignatura AS asignatura,
             a.Nombre AS asignatura_nombre,
             a.Semestre AS semestre,
             comp.ID_Competencia AS competencia,
             comp.Nombre AS competencia_nombre,
             COUNT(DISTINCT r.ID_RA) AS n_ra
      FROM ra r
      JOIN ra_competencia rc ON rc.ra_ID_RA = r.ID_RA
      JOIN competencia comp ON comp.ID_Competencia = rc.competencia_ID_Competencia
      JOIN asignatura a ON a.ID_Asignatura = r.asignatura_ID_Asignatura
      WHERE a.carrera_ID_Carrera = ? AND a.Estado = 'Activo' ${planFilter}
      GROUP BY a.ID_Asignatura, a.Nombre, a.Semestre, comp.ID_Competencia, comp.Nombre
      ORDER BY a.Semestre, a.Nombre, comp.Nombre
    `, params);

    const tributacion = (tributacionRows || []).map(r => ({
      ...r,
      n_ra: Number(r.n_ra) || 0
    }));

    console.log(`[ComiteDashboard] ✅ malla:${malla.length} cobertura:${cobertura.length} tributacion:${tributacion.length}`);
    res.json({ filtros, malla, cobertura, tributacion });
  } catch (err) {
    console.error('[ComiteDashboard] ❌ Error:', err);
    res.status(500).json({ error: 'Error al obtener el dashboard del comité' });
  }
});

module.exports = router;
