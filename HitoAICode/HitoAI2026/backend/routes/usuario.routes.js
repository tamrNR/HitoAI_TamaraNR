const express = require('express');
const router = express.Router();
const controller = require('../controllers/usuario.controller');
const { verifyAuth, authorizeRoles } = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

// Prueba (requiere sesión)
router.get('/test', verifyAuth, (req, res) => {
  res.json({ ok: true, message: 'Ruta /api/usuario/test funcionando' });
});

// Rutas
router.post('/login', loginLimiter, controller.login); // público (con rate limit)
router.post('/crear', verifyAuth, authorizeRoles('Administrador'), controller.crearUsuario);
router.get('/jefes', verifyAuth, authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.getJefesCarrera);
router.get('/profesores', verifyAuth, authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), controller.getProfesores);
router.get('/todos', verifyAuth, authorizeRoles('Administrador'), controller.getTodos);
router.put('/clave/:id', verifyAuth, controller.actualizarClave); // self o Administrador (validado en controller)
router.put('/rol/:id', verifyAuth, authorizeRoles('Administrador'), controller.actualizarRol);
router.delete('/eliminar/:id', verifyAuth, authorizeRoles('Administrador'), controller.eliminar);

module.exports = router;
