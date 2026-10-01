const { Router } = require('express');
const router = Router();
const ReporteExportController = require('../controllers/reporteExport.controller');

router.post('/exportar', ReporteExportController.generarReporteAnalitica);

module.exports = router;
