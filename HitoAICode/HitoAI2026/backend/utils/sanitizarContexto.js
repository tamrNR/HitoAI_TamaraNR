// utils/sanitizarContexto.js
// Elimina datos personales del alumno (nombre, RUT, id) antes de enviar
// el contexto a OpenAI o guardarlo en ai_analisis.

const CLAVES_EXACTAS = new Set(['nombre', 'apellido', 'idestudiante']);
const CLAVES_INDIVIDUAL = ['alumno', 'alumnoNombre', 'idEstudiante'];

function esClaveSensible(key) {
  const k = String(key).toLowerCase();
  return CLAVES_EXACTAS.has(k) || k.includes('alumno') || k.includes('rut');
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
