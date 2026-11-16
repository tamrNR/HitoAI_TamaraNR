const express = require('express');
const router = express.Router();
const controller = require('../controllers/competencia.controller');
const { verifyAuth, authorizeRoles } = require('../middleware/auth.middleware');

const ROLES_LECTURA = ['Administrador', 'Profesor', 'Jefe de Carrera', 'Comité Curricular', 'Decano'];
// Catálogo global de competencias del perfil de egreso: escritura solo Administrador
const ROLES_ESCRITURA = ['Administrador'];

router.use(verifyAuth);

router.get('/', authorizeRoles(...ROLES_LECTURA), controller.getAllCompetencias);
router.get('/:id', authorizeRoles(...ROLES_LECTURA), controller.getCompetenciaById);
router.post('/crear', authorizeRoles(...ROLES_ESCRITURA), controller.crearCompetencia);
router.put('/actualizar/:id', authorizeRoles(...ROLES_ESCRITURA), controller.actualizarCompetencia);
router.delete('/eliminar/:id', authorizeRoles(...ROLES_ESCRITURA), controller.eliminarCompetencia);

module.exports = router;
