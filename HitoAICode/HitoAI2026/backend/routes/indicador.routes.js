const express = require('express');
const router = express.Router();
const controller = require('../controllers/indicador.controller');

router.get('/por-contenido/:id', controller.obtenerPorContenido);
router.get('/criterios/:id', controller.obtenerCriteriosPorIndicador); // ✅ NUEVO
router.post('/crear', controller.crear);
router.put('/actualizar/:id', controller.actualizar);
router.delete('/eliminar/:id', controller.eliminar);

module.exports = router;
