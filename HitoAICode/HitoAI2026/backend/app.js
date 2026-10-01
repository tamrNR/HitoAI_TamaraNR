// ===============================
// app.js – compatible con Express 5.x
// ===============================
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// Captura global para evitar que el servidor se caiga por errores inesperados
process.on('unhandledRejection', (reason) => {
  console.error('🛡️ UnhandledRejection capturado:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🛡️ UncaughtException capturado:', err);
});

// === CORS UNIVERSAL PARA DESARROLLO LOCAL ===
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (Postman, Thunder Client, etc.)
    if (!origin) {
      console.log('✅ Petición sin origen permitida (Postman/Thunder Client)');
      return callback(null, true);
    }
    
    // Permitir CUALQUIER puerto en localhost o 127.0.0.1
    const regexLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
    if (regexLocal.test(origin)) {
      console.log('✅ CORS permitido para:', origin);
      return callback(null, true);
    }
    
    // Bloquear otros orígenes
    console.log('❌ Bloqueado por CORS:', origin);
    return callback(new Error('No autorizado por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-user-role']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
const { authorizeRoles } = require('./middleware/auth.middleware');

// Registrar rutas
app.use('/api/usuario', usuarioRoutes);
app.use('/api/aplicacion', aplicacionRoutes);
app.use('/api/asignatura', asignaturaRoutes);
app.use('/api/carrera', authorizeRoles('Administrador', 'Jefe de Carrera'), carreraRoutes);
app.use('/api/competencia', competenciaRoutes);
app.use('/api/contenido', contenidoRoutes);
app.use('/api/estudiante', estudianteRoutes);
app.use('/api/evaluacion', evaluacionRoutes);
app.use('/api/indicador', indicadorRoutes);
app.use('/api/inscripcion', inscripcionRoutes);
app.use('/api/ra', raRoutes);
app.use('/api/reporte', reporteRoutes);
app.use('/api/rol', rolRoutes);
app.use('/api/analisis', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), analisisRoutes);
app.use('/api/graficos', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), graficosRoutes); // ✅ Gráficos de analítica con autorización
app.use('/api/analitica', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), analiticaFiltrosRoutes); // ✅ Filtros de analítica con autorización
app.use('/api/analitica-filtros', authorizeRoles('Administrador', 'Jefe de Carrera', 'Comité Curricular'), analiticaFiltrosRoutes); // ✅ Alias solicitado con autorización
app.use('/api/facultad', facultadRoutes);

console.log('✅ Todas las rutas cargadas correctamente');

// === RUTA BASE ===
app.get('/', (req, res) => {
  res.json({ message: '🚀 API funcionando correctamente' });
});

// === RUTA DE PRUEBA CORS ===
app.get('/api/test', (req, res) => {
  console.log('[Test] 📡 Petición de prueba CORS desde:', req.headers.origin || 'Sin origen');
  res.json({ 
    mensaje: '✅ CORS funcionando correctamente',
    origen: req.headers.origin || 'Sin origen',
    timestamp: new Date().toISOString()
  });
});

// === INICIO SERVIDOR ===
const PORT = process.env.PORT || 8080; // ✅ Cambiado a 8080 para coincidir con Angular
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});

// === CONEXIÓN BD ===
const connection = require('./db/connection');
connection.connect(err => {
  if (err) throw err;
  console.log('✅ Conectado a la base de datos MySQL');
});

// === Middleware de manejo de errores (último) ===
app.use((err, req, res, next) => {
  try {
    console.error('🔥 Error no manejado en middleware:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  } catch (e) {
    console.error('🔥 Error al responder desde el middleware de errores:', e);
    // Evitar caída silenciosa
  }
});
