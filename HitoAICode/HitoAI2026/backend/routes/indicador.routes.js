const express = require('express');
const router = express.Router();
const controller = require('../controllers/indicador.controller');
const { verifyAuth, authorizeRoles, scopeContenido, scopeIndicador } = require('../middleware/auth.middleware');

const ROLES_LECTURA = ['Administrador', 'Profesor', 'Jefe de Carrera', 'Comité Curricular'];
const ROLES_ESCRITURA = ['Administrador', 'Jefe de Carrera', 'Comité Curricular'];

router.use(verifyAuth);

router.get('/por-contenido/:id',
  authorizeRoles(...ROLES_LECTURA), scopeContenido((req) => req.params.id), controller.obtenerPorContenido);
router.get('/criterios/:id',
  authorizeRoles(...ROLES_LECTURA), scopeIndicador((req) => req.params.id), controller.obtenerCriteriosPorIndicador);
router.post('/crear',
  authorizeRoles(...ROLES_ESCRITURA),
  scopeContenido((req) => req.body?.indicador?.contenido_ID_Contenido ?? req.body?.contenido_ID_Contenido),
  controller.crear);
router.put('/actualizar/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeIndicador((req) => req.params.id), controller.actualizar);
router.delete('/eliminar/:id',
  authorizeRoles(...ROLES_ESCRITURA), scopeIndicador((req) => req.params.id), controller.eliminar);

module.exports = router;
