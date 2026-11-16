// ===============================
// app.js – compatible con Express 5.x
// ===============================
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Captura global para evitar que el servidor se caiga por errores inesperados
process.on('unhandledRejection', (reason) => {
  console.error('🛡️ UnhandledRejection capturado:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🛡️ UncaughtException capturado:', err);
});

app.use(helmet());

// === CORS ===
// Orígenes permitidos: CORS_ORIGIN (separados por coma) + localhost/127.0.0.1 en desarrollo
const origenesEnv = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const regexLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    // Peticiones sin origen (Postman,Thunder Client, mismo origen) se permiten:
    // la autenticación real es el JWT, no la cookie de sesión
    if (!origin) {
      return callback(null, true);
    }
    if (origenesEnv.includes(origin) || regexLocal.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('No autorizado por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// === RUTAS ===
console.log('🧩 Cargando rutas...');

const usuarioRoutes = require('./routes/usuario.routes');
const aplicacionRoutes = require('./routes/aplicacion.routes');
const asignaturaRoutes = require('./routes/asignatura.routes');
const carreraRoutes = require('./routes/carrera.routes');
const competenciaRoutes = require('./routes/competencia.routes');
const contenidoRoutes = require('./routes/contenido.routes');
const estudianteRoutes = require('./routes/estudiante.routes');
const evaluacionRoutes = require('./routes/evaluacion.routes');
const indicadorRoutes = require('./routes/indicador.routes');
const inscripcionRoutes = require('./routes/inscripcion.routes');
const raRoutes = require('./routes/ra.routes');
const reporteRoutes = require('./routes/reporte.routes');
const rolRoutes = require('./routes/rol.routes');
const analisisRoutes = require('./routes/analisis.routes');
const graficosRoutes = require('./routes/graficos.routes'); // ✅ Gráficos de analítica
const analiticaFiltrosRoutes = require('./routes/analitica-filtros.routes'); // ✅ Filtros de analítica
const facultadRoutes = require('./routes/facultad.routes');
const comiteRoutes = require('./routes/comite.routes'); // ✅ Panel Comité Curricular
const { verifyAuth } = require('./middleware/auth.middleware');

// Registrar rutas (la autorización por rol/scope vive dentro de cada router)
app.use('/api/usuario', usuarioRoutes);
app.use('/api/aplicacion', aplicacionRoutes);
app.use('/api/asignatura', asignaturaRoutes);
app.use('/api/carrera', carreraRoutes);
app.use('/api/competencia', competenciaRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/evaluacion', evaluacionRoutes);
app.use('/api/indicador', indicadorRoutes);
app.use('/api/inscripcion', inscripcionRoutes);
app.use('/api/ra', raRoutes);
app.use('/api/reporte', reporteRoutes);
app.use('/api/rol', rolRoutes);
app.use('/api/analisis', analisisRoutes);
app.use('/api/graficos', graficosRoutes);
app.use('/api/analitica', analiticaFiltrosRoutes);
app.use('/api/analitica-filtros', analiticaFiltrosRoutes);
app.use('/api/facultad', facultadRoutes);
app.use('/api/comite', comiteRoutes);

console.log('✅ Todas las rutas cargadas correctamente');

// === RUTA BASE ===
app.get('/', (req, res) => {
  res.json({ message: '🚀 API funcionando correctamente' });
});

// === RUTA DE PRUEBA CORS ===
app.get('/api/test', verifyAuth, (req, res) => {
  res.json({
    mensaje: '✅ API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// === INICIO SERVIDOR ===
const PORT = process.env.PORT || 8080; // ✅ Cambiado a 8080 para coincidir con Angular
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  });
}

// === CONEXIÓN BD ===
const connection = require('./db/connection');
if (require.main === module) {
  connection.connect(err => {
    if (err) {
      console.error('❌ Error de conexión a MySQL:', err.message);
      return;
    }
    console.log('✅ Conectado a la base de datos MySQL');
  });
}

// === Middleware de manejo de errores (último) ===
app.use((err, req, res, next) => {
  try {
    console.error('🔥 Error no manejado en middleware:', err?.message || err);
    if (res.headersSent) {
      return next(err);
    }
    // No exponer trazas ni detalles internos al cliente
    if (err?.message === 'No autorizado por CORS') {
      return res.status(403).json({ error: 'No autorizado por CORS' });
    }
    if (err?.name === 'MulterError') {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Archivo demasiado grande' : 'Error al procesar el archivo' });
    }
    const status = err?.status || err?.statusCode || 500;
    const mensaje = status >= 500 ? 'Error interno del servidor' : (err.message || 'Solicitud inválida');
    res.status(status).json({ error: mensaje });
  } catch (e) {
    console.error('🔥 Error al responder desde el middleware de errores:', e);
    // Evitar caída silenciosa
  }
});

module.exports = app;
