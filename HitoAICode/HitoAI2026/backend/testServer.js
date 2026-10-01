const express = require('express');
const app = express();

// Test router directo
const router = express.Router();

router.get('/ping', (req, res) => {
  console.log('📡 Ruta /api/usuario/ping alcanzada');
  res.json({ ok: true, message: 'Servidor responde correctamente' });
});

// Asignar el router a la ruta base
app.use('/api/usuario', router);

// Puerto
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en puerto ${PORT}`);
});
