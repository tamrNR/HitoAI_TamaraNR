const express = require('express');
const router = express.Router();
const controller = require('../controllers/estudiante.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', controller.getAll);
router.get('/no-inscritos', controller.getNoInscritos);
router.get('/disponibles/:id', controller.getDisponiblesPorAsignatura);
router.post('/crear', controller.crear);
router.put('/actualizar/:id', controller.actualizar);
router.delete('/eliminar/:id', controller.eliminar);
router.post('/cargar-csv', upload.single('archivo'), controller.cargarCSV);

module.exports = router;
