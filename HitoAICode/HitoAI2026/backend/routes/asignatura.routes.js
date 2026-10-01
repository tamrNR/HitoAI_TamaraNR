const express = require('express');
const router = express.Router();
const controller = require('../controllers/asignatura.controller');
const { authorizeRoles } = require('../middleware/auth.middleware');

// Rutas de gestión de asignaturas (Administrador, Jefe de Carrera y Comité Curricular)
router.get('/', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.obtenerTodas);
router.get('/por-jefe/:rut', authorizeRoles('Administrador', 'Jefe de Carrera'), controller.obtenerPorCarreraDelJefe);
router.post('/crear', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.crear);
router.put('/actualizar/:id', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.actualizar);
router.put('/actualizar-umbral/:id', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.actualizarUmbral);
router.delete('/eliminar/:id', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.eliminar);
router.get('/umbral/:id', controller.obtenerUmbral);

// Ruta para asignaturas de profesor (Administrador y Profesor)
router.get('/por-profesor/:rut', authorizeRoles('Administrador', 'Profesor'), controller.obtenerPorProfesor);

module.exports = router;
