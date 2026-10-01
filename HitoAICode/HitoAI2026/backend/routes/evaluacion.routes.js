const express = require('express');
const router = express.Router();
const controller = require('../controllers/evaluacion.controller');

router.get('/contar/:idAsignatura', controller.contarPorAsignatura);
router.post('/crear-con-aplicaciones', controller.crearConAplicaciones);
router.get('/por-asignatura/:id', controller.obtenerPorAsignatura);
router.get('/contenidos-usados/:asignaturaID', controller.obtenerContenidosUsados);
router.delete('/eliminar/:id', controller.eliminar);
router.put('/editar/:id', controller.actualizar);

module.exports = router;
