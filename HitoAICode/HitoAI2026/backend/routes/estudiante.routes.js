const express = require('express');
const router = express.Router();
const controller = require('../controllers/estudiante.controller');
const multer = require('multer');
const { verifyAuth, authorizeRoles, scopeAsignatura } = require('../middleware/auth.middleware');

const ROLES_LECTURA = ['Administrador', 'Jefe de Carrera', 'Comité Curricular'];
const ROLES_ESCRITURA = ['Administrador', 'Jefe de Carrera'];

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // máx. 5 MB
  fileFilter: (req, file, cb) => {
    const esCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      /\.csv$/i.test(file.originalname || '');
    if (esCsv) return cb(null, true);
    const e = new Error('Solo se permiten archivos CSV');
    e.status = 400;
    return cb(e);
  }
});

router.use(verifyAuth);

router.get('/', authorizeRoles(...ROLES_LECTURA), controller.getAll);
router.get('/no-inscritos', authorizeRoles(...ROLES_LECTURA), controller.getNoInscritos);
router.get('/disponibles/:id',
  authorizeRoles(...ROLES_LECTURA), scopeAsignatura((req) => req.params.id), controller.getDisponiblesPorAsignatura);
router.post('/crear', authorizeRoles(...ROLES_ESCRITURA), controller.crear);
router.put('/actualizar/:id', authorizeRoles(...ROLES_ESCRITURA), controller.actualizar);
router.delete('/eliminar/:id', authorizeRoles(...ROLES_ESCRITURA), controller.eliminar);
router.post('/cargar-csv', authorizeRoles(...ROLES_ESCRITURA), upload.single('archivo'), controller.cargarCSV);

module.exports = router;
