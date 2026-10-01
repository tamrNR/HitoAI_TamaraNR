const express = require('express');
const router = express.Router();
const controller = require('../controllers/ra.controller');

router.get('/', controller.getAllRA);
router.get('/:id', controller.getRAById);
router.post('/crear', controller.crearRA);
router.put('/actualizar/:id', controller.actualizarRA);
router.delete('/eliminar/:id', controller.eliminarRA);
router.get('/por-asignatura/:id', controller.getRAByAsignatura);
router.get('/por-contenido/:idContenido', controller.getRAByContenido);
router.put('/competencias/:id', controller.actualizarCompetencias);


module.exports = router;
