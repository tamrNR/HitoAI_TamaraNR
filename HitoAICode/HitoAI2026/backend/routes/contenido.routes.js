const express = require('express');
const router = express.Router();
const controller = require('../controllers/contenido.controller');
const { verifyAuth, authorizeRoles, scopeAsignatura, scopeContenido, scopeRA } = require('../middleware/auth.middleware');

const ROLES_LECTURA = ['Administrador', 'Profesor', 'Jefe de Carrera', 'Comité Curricular'];
const ROLES_ESCRITURA = ['Administrador', 'Jefe de Carrera', 'Comité Curricular'];

router.use(verifyAuth);

router.get('/por-asignatura/:id',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.id), controller.obtenerPorAsignatura);
router.post('/crear',
  authorizeRoles(...ROLES_ESCRITURA),
  scopeAsignatura((req) => req.body?.asignatura_ID_Asignatura),
  controller.crear);
router.put('/actualizar/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeContenido((req) => req.params.id), controller.actualizar);
router.delete('/eliminar/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeContenido((req) => req.params.id), controller.eliminar);
router.get('/resumen/:id',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.id), controller.resumenCurricular);
router.get('/competencias-ra/:idRA',
  authorizeRoles(...ROLES_LECTURA), scopeRA((req) => req.params.idRA), controller.obtenerCompetenciasDeRA);

module.exports = router;
