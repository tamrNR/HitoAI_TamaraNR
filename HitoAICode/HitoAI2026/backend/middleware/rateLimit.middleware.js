const rateLimit = require('express-rate-limit');

// Login: 20 intentos cada 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de login. Intenta más tarde.' }
});

// Endpoints de IA / exportación: 30 solicitudes cada hora por IP
const iaLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Límite de solicitudes de análisis/IA alcanzado. Intenta más tarde.' }
});

module.exports = { loginLimiter, iaLimiter };
