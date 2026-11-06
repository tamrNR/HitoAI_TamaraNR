// utils/sanitizarContexto.js
// Elimina datos personales del alumno (nombre, RUT, id) antes de enviar
// el contexto a OpenAI o guardarlo en ai_analisis.

// Coincidencia exacta sin mayúsculas. NO usar subcadena: borraría
// claves legítimas como 'ruta', 'nAlumnos' o 'totalAlumnos'.
const CLAVES_SENSIBLES = new Set([
  'alumno', 'alumnonombre', 'nombre', 'apellido', 'rut',
  'idestudiante', 'estudiante', 'nombreestudiante',
  'rutalumno', 'rutestudiante', 'nombrecompleto', 'nombrealumno',
  'idalumno', 'rutdelalumno', 'run', 'dni'
]);
const CLAVES_INDIVIDUAL = ['alumno', 'alumnoNombre', 'idEstudiante', 'estudiante', 'nombreEstudiante'];

function esClaveSensible(key) {
  return CLAVES_SENSIBLES.has(String(key).toLowerCase());
}

function limpiar(valor) {
  if (Array.isArray(valor)) return valor.map(limpiar);
  if (valor && typeof valor === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(valor)) {
      if (esClaveSensible(k)) continue;
      out[k] = limpiar(v);
    }
    return out;
  }
  return valor;
}

function tieneAlumno(context) {
  return CLAVES_INDIVIDUAL.some(k => {
    const v = context[k];
    return v !== undefined && v !== null && v !== '';
  }) || context.modo === 'individual';
}

function sanitizarContexto(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return { modo: 'curso' };
  }
  const modo = tieneAlumno(context) ? 'individual' : 'curso';
  const limpio = limpiar(context);
  limpio.modo = modo;
  return limpio;
}

module.exports = { sanitizarContexto };
