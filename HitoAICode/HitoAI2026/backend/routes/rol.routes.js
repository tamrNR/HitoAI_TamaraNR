const express = require('express');
const router = express.Router();
const controller = require('../controllers/rol.controller');

// Ruta para obtener todos los roles
router.get('/', controller.getAllRoles);

module.exports = router;
