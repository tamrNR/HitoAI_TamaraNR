const express = require('express');
const router = express.Router();
const controller = require('../controllers/asignatura.controller');
const { verifyAuth, authorizeRoles, scopeAsignatura, scopeCarrera } = require('../middleware/auth.middleware');

const ROLES_GESTION = ['Administrador', 'Jefe de Carrera', 'Comité Curricular'];
const ROLES_LECTURA = ['Administrador', 'Profesor', 'Jefe de Carrera', 'Comité Curricular', 'Decano'];

router.use(verifyAuth);

// Listado: el controller filtra por ámbito del usuario (carrera/facultad/propio)
router.get('/', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular', 'Decano'), controller.obtenerTodas);
router.get('/por-jefe/:rut', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.obtenerPorCarreraDelJefe);
router.post('/crear',
  authorizeRoles(...ROLES_GESTION),
  scopeCarrera((req) => req.body?.carrera_ID_Carrera),
  controller.crear);
router.put('/actualizar/:id',
  authorizeRoles(...ROLES_GESTION),
  scopeAsignatura((req) => req.params.id),
  scopeCarrera((req) => req.body?.carrera_ID_Carrera),
  controller.actualizar);
router.put('/actualizar-umbral/:id',
  authorizeRoles(...ROLES_GESTION), scopeAsignatura((req) => req.params.id), controller.actualizarUmbral);
router.delete('/eliminar/:id',
  authorizeRoles(...ROLES_GESTION), scopeAsignatura((req) => req.params.id), controller.eliminar);
router.get('/umbral/:id',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.id), controller.obtenerUmbral);

// Ruta para asignaturas de profesor (solo el propio profesor o Administrador; validado en controller)
router.get('/por-profesor/:rut', authorizeRoles('Administrador', 'Profesor'), controller.obtenerPorProfesor);

module.exports = router;
