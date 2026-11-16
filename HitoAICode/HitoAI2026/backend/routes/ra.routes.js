const express = require('express');
const router = express.Router();
const controller = require('../controllers/ra.controller');
const { verifyAuth, authorizeRoles, scopeAsignatura, scopeContenido, scopeRA } = require('../middleware/auth.middleware');

const ROLES_LECTURA = ['Administrador', 'Profesor', 'Jefe de Carrera', 'Comité Curricular'];
const ROLES_ESCRITURA = ['Administrador', 'Jefe de Carrera', 'Comité Curricular'];

router.use(verifyAuth);

router.get('/', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.getAllRA);
router.get('/:id', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.getRAById);
router.post('/crear',
  authorizeRoles(...ROLES_ESCRITURA),
  scopeAsignatura((req) => req.body?.asignatura_ID_Asignatura),
  controller.crearRA);
router.put('/actualizar/:id',
  authorizeRoles(...ROLES_ESCRITURA),
  scopeRA((req) => req.params.id),
  scopeAsignatura((req) => req.body?.asignatura_ID_Asignatura),
  controller.actualizarRA);
router.delete('/eliminar/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeRA((req) => req.params.id), controller.eliminarRA);
router.get('/por-asignatura/:id',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.id), controller.getRAByAsignatura);
router.get('/por-contenido/:idContenido',
  authorizeRoles(...ROLES_LECTURA), scopeContenido((req) => req.params.idContenido), controller.getRAByContenido);
router.put('/competencias/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeRA((req) => req.params.id), controller.actualizarCompetencias);

module.exports = router;
