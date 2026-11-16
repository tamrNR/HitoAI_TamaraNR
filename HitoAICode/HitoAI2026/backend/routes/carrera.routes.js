const express = require('express');
const router = express.Router();
const controller = require('../controllers/carrera.controller');
const { verifyAuth, authorizeRoles, scopeCarrera } = require('../middleware/auth.middleware');

router.use(verifyAuth);

// Listado filtrado por ámbito en el controller (carrera/facultad/propio)
router.get('/', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular', 'Decano', 'Profesor'), controller.getAllCarreras);
// Carreras son estructura institucional: escritura solo Administrador
router.post('/crear', authorizeRoles('Administrador'), controller.crearCarrera);
router.put('/actualizar/:id', authorizeRoles('Administrador'), controller.actualizarCarrera);
router.delete('/eliminar/:id', authorizeRoles('Administrador'), controller.eliminarCarrera);
router.get('/estadisticas/:id',
  authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular', 'Decano'),
  scopeCarrera((req) => req.params.id),
  controller.getEstadisticas);

module.exports = router;
