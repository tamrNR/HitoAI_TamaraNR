const express = require('express');
const router = express.Router();
const controller = require('../controllers/inscripcion.controller');
const connection = require('../db/connection');

// Crear inscripciones masivas
router.post('/crear-masivo', controller.crearMasivo);

// Obtener estudiantes inscritos por asignatura
router.get('/por-asignatura/:id', controller.obtenerPorAsignatura);

// Eliminar inscripción (requiere query params: ?asignatura=...&estudiante=...)
router.delete('/eliminar', controller.eliminar);

// Obtener alumnos inscritos (activos) de un curso por asignatura (query param)
router.get('/alumnos-curso', (req, res) => {
  const { asignatura, anio } = req.query;

  if (!asignatura) {
    return res.status(400).json({
      error: 'Faltan parámetros requeridos',
      requeridos: ['asignatura']
    });
  }

  let sql = `
  SELECT 
    i.ID_Inscripcion      AS idInscripcion,
    i.Anio                AS anio,
    i.Semestre            AS semestre,
    e.ID_Estudiante       AS idEstudiante,
    e.Nombre              AS nombre,
    e.Apellido            AS apellido
  FROM inscripcion i
  JOIN estudiante e 
    ON e.ID_Estudiante = i.estudiante_ID_Estudiante
  WHERE i.asignatura_ID_Asignatura = ?
    AND i.Estado = 'Activo'
  `;
  const params = [asignatura];
  if (anio) {
    sql += ' AND i.Anio = ?';
    params.push(anio);
  }
  sql += ' ORDER BY e.Apellido, e.Nombre';

  connection.query(sql, params, (err, rows) => {
    if (err) {
      console.error('[Inscripcion] ❌ Error al obtener alumnos del curso:', err);
      return res.status(500).json({ error: 'Error al obtener alumnos del curso' });
    }

    res.json(rows);
  });
});

module.exports = router;
