const { Router } = require('express');
const router = Router();
const ReporteExportController = require('../controllers/reporteExport.controller');
const { verifyAuth, authorizeRoles, obtenerScopeAsignatura, usuarioPuedeVerAsignatura, normalize } = require('../middleware/auth.middleware');
const { iaLimiter } = require('../middleware/rateLimit.middleware');

const ROLES_REPORTE = ['Administrador', 'Jefe de Carrera', 'Comité Curricular', 'Decano'];

// Verifica que todas las asignaturas referenciadas en charts[].context.asignatura
// estén dentro del ámbito del usuario (el cliente nunca define el alcance).
const verificarScopeCharts = async (req, res, next) => {
  try {
    if (normalize(req.user?.rol) === 'administrador') return next();
    const charts = Array.isArray(req.body?.charts) ? req.body.charts : [];
    const asignaturas = [...new Set(
      charts.map(c => c?.context?.asignatura).filter(a => a !== undefined && a !== null && a !== '')
    )];
    if (asignaturas.length === 0) {
      return res.status(400).json({ message: 'No se pudo verificar el ámbito: falta asignatura en el contexto' });
    }
    for (const id of asignaturas) {
      const asignatura = await obtenerScopeAsignatura(id);
      if (!asignatura || !usuarioPuedeVerAsignatura(req.user, asignatura)) {
        return res.status(403).json({ error: 'No autorizado: el reporte incluye asignaturas fuera de tu ámbito' });
      }
    }
    next();
  } catch (e) {
    console.error('[Reporte] Error verificando scope:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

router.use(verifyAuth);
router.post('/exportar', iaLimiter, authorizeRoles(...ROLES_REPORTE), verificarScopeCharts, ReporteExportController.generarReporteAnalitica);

module.exports = router;
