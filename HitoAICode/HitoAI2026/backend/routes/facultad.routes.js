const express = require('express');
const router = express.Router();
const controller = require('../controllers/facultad.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// Catálogo de facultades: cualquier usuario autenticado puede consultarlo
router.get('/', verifyAuth, controller.getAll);

module.exports = router;
