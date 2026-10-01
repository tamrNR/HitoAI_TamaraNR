const express = require('express');
const router = express.Router();
const controller = require('../controllers/aplicacion.controller');

router.get('/indicadores/:evaluacionID/:asignaturaID', controller.obtenerIndicadoresPorEvaluacion);
router.post('/actualizar-puntajes', controller.actualizarPuntajesGrupo);
router.get('/aplicados/:evaluacionID/:asignaturaID', controller.obtenerEstudiantesAplicados);
router.get('/evaluadas/:evaluacionID/:asignaturaID', controller.obtenerAplicacionesEvaluadas);
router.get('/grupos/:evaluacionID/:asignaturaID', controller.obtenerGruposPorEvaluacion);
router.get('/puntajes/:evaluacionID/:asignaturaID/:estudianteID', controller.obtenerPuntajesEstudiante);
router.post('/asignar-grupo', controller.asignarGrupoAGrupo);
router.post('/disolver', controller.disolverGrupo);

// ✅ NUEVO: Grupos incluso sin puntajes
router.get('/agrupadas/:evaluacionID/:asignaturaID', controller.obtenerAplicacionesAgrupadas);

module.exports = router;
