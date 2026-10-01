const express = require('express');
const cors = require('cors');
const router = express.Router();
const controller = require('../controllers/usuario.controller');

router.use(cors({
  origin: true, // Acepta todos los orígenes en desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
}));

// Prueba
router.get('/test', (req, res) => {
  res.json({ ok: true, message: 'Ruta /api/usuario/test funcionando' });
});

// Rutas
router.post('/crear', controller.crearUsuario);
router.post('/login', controller.login);
router.get('/jefes', controller.getJefesCarrera);
router.get('/profesores', controller.getProfesores);
router.get('/todos', controller.getTodos);
router.put('/clave/:id', controller.actualizarClave);
router.put('/rol/:id', controller.actualizarRol);
router.delete('/eliminar/:id', controller.eliminar);

module.exports = router;
