const express = require('express');
const router = express.Router();
const controller = require('../controllers/inscripcion.controller');
const connection = require('../db/connection');
const { verifyAuth, authorizeRoles, scopeAsignatura, obtenerScopeAsignatura, usuarioPuedeVerAsignatura } = require('../middleware/auth.middleware');

const ROLES_LECTURA = ['Administrador', 'Profesor', 'Jefe de Carrera', 'Comité Curricular'];
const ROLES_ESCRITURA = ['Administrador', 'Jefe de Carrera'];

router.use(verifyAuth);

// Crear inscripciones masivas (cada inscripción se valida contra el ámbito de su asignatura)
router.post('/crear-masivo', authorizeRoles(...ROLES_ESCRITURA), async (req, res, next) => {
  const { inscripciones } = req.body || {};
  if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
    return res.status(400).json({ message: 'Se requiere un array de inscripciones' });
  }
  // Todas las inscripciones deben pertenecer a asignaturas dentro del ámbito del usuario
  const asignaturas = [...new Set(inscripciones.map(i => i?.asignatura_ID_Asignatura).filter(Boolean))];
  if (asignaturas.length === 0) {
    return res.status(400).json({ message: 'Inscripciones sin asignatura' });
  }
  try {
    for (const id of asignaturas) {
      const asignatura = await obtenerScopeAsignatura(id);
      if (!asignatura || !usuarioPuedeVerAsignatura(req.user, asignatura)) {
        return res.status(403).json({ error: 'No autorizado: la asignatura no pertenece a tu ámbito' });
      }
    }
    next();
  } catch (e) {
    console.error('[Inscripcion] Error verificando scope:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
}, controller.crearMasivo);

// Obtener estudiantes inscritos por asignatura
router.get('/por-asignatura/:id',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.id), controller.obtenerPorAsignatura);

// Eliminar inscripción (query params: ?asignatura=...&estudiante=...&anio=...)
router.delete('/eliminar',
  authorizeRoles(...ROLES_ESCRITURA), scopeAsignatura((req) => req.query.asignatura), controller.eliminar);

// Obtener alumnos inscritos (activos) de un curso por asignatura (query param)
router.get('/alumnos-curso', authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.query.asignatura), (req, res) => {
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
