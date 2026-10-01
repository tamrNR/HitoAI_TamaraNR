const express = require('express');
const router = express.Router();
const controller = require('../controllers/competencia.controller');

router.get('/', controller.getAllCompetencias);
router.get('/:id', controller.getCompetenciaById);
router.post('/crear', controller.crearCompetencia);
router.put('/actualizar/:id', controller.actualizarCompetencia);
router.delete('/eliminar/:id', controller.eliminarCompetencia);

module.exports = router;
