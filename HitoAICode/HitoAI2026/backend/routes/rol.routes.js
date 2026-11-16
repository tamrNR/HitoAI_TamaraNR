const express = require('express');
const router = express.Router();
const controller = require('../controllers/rol.controller');
const { verifyAuth } = require('../middleware/auth.middleware');

// Catálogo de roles: cualquier usuario autenticado puede consultarlo
router.get('/', verifyAuth, controller.getAllRoles);

module.exports = router;
