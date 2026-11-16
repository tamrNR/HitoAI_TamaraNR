const express = require('express');
const router = express.Router();
const controller = require('../controllers/aplicacion.controller');
const { verifyAuth, authorizeRoles, scopeAsignatura } = require('../middleware/auth.middleware');

const ROLES = ['Administrador', 'Profesor', 'Jefe de Carrera'];
const porAsignatura = (param) => scopeAsignatura((req) => req.params[param]);

router.use(verifyAuth);

router.get('/indicadores/:evaluacionID/:asignaturaID',
  authorizeRoles(...ROLES), porAsignatura('asignaturaID'), controller.obtenerIndicadoresPorEvaluacion);
router.post('/actualizar-puntajes',
  authorizeRoles(...ROLES),
  scopeAsignatura((req) => (Array.isArray(req.body) ? req.body[0]?.asignaturaID : req.body?.grupos?.[0]?.asignaturaID)),
  controller.actualizarPuntajesGrupo);
router.get('/aplicados/:evaluacionID/:asignaturaID',
  authorizeRoles(...ROLES), porAsignatura('asignaturaID'), controller.obtenerEstudiantesAplicados);
router.get('/evaluadas/:evaluacionID/:asignaturaID',
  authorizeRoles(...ROLES), porAsignatura('asignaturaID'), controller.obtenerAplicacionesEvaluadas);
router.get('/grupos/:evaluacionID/:asignaturaID',
  authorizeRoles(...ROLES), porAsignatura('asignaturaID'), controller.obtenerGruposPorEvaluacion);
router.get('/puntajes/:evaluacionID/:asignaturaID/:estudianteID',
  authorizeRoles(...ROLES), porAsignatura('asignaturaID'), controller.obtenerPuntajesEstudiante);
router.post('/asignar-grupo',
  authorizeRoles(...ROLES),
  scopeAsignatura((req) => req.body?.grupo?.asignaturaID ?? req.body?.asignaturaID),
  controller.asignarGrupoAGrupo);
router.post('/disolver',
  authorizeRoles(...ROLES),
  scopeAsignatura((req) => req.body?.asignaturaID),
  controller.disolverGrupo);

// ✅ NUEVO: Grupos incluso sin puntajes
router.get('/agrupadas/:evaluacionID/:asignaturaID',
  authorizeRoles(...ROLES), porAsignatura('asignaturaID'), controller.obtenerAplicacionesAgrupadas);

module.exports = router;
