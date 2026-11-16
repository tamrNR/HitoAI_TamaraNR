const express = require('express');
const router = express.Router();
const controller = require('../controllers/evaluacion.controller');
const { verifyAuth, authorizeRoles, scopeAsignatura, scopeEvaluacion } = require('../middleware/auth.middleware');

const ROLES_LECTURA = ['Administrador', 'Profesor', 'Jefe de Carrera', 'Comité Curricular'];
const ROLES_ESCRITURA = ['Administrador', 'Profesor', 'Jefe de Carrera'];

router.use(verifyAuth);

router.get('/contar/:idAsignatura',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.idAsignatura), controller.contarPorAsignatura);
router.post('/crear-con-aplicaciones',
  authorizeRoles(...ROLES_ESCRITURA),
  scopeAsignatura((req) => req.body?.asignatura_ID_Asignatura),
  controller.crearConAplicaciones);
router.get('/por-asignatura/:id',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.id), controller.obtenerPorAsignatura);
router.get('/contenidos-usados/:asignaturaID',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.asignaturaID), controller.obtenerContenidosUsados);
router.delete('/eliminar/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeEvaluacion((req) => req.params.id), controller.eliminar);
router.put('/editar/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeEvaluacion((req) => req.params.id), controller.actualizar);

module.exports = router;
