// ===============================
// PU-10: Manejo de respuestas inválidas o errores del servicio de OpenAI
// ===============================
import assert from 'node:assert';
import { generarAnalisisDesdeDatos } from '../openai.service.js';

console.log('Ejecutando PU-10: Manejo de respuestas inválidas y errores de OpenAI...\n');

// Datos de prueba comunes
const chartData = {
  chart: {
    x: { values: ['CD1'] },
    series: [{ name: 'Alumno', unit: '%', values: [75] }]
  },
  context: { tipoGrafico: 'radar' }
};

// Caso 1 — Respuesta no JSON
console.log('Caso 1: Respuesta no JSON');
const mock1 = {
  responses: {
    create: async () => ({
      output_text: 'Esta respuesta no es JSON'
    })
  }
};
const resultado1 = await generarAnalisisDesdeDatos(chartData, mock1);
assert.deepStrictEqual(resultado1, {
  analysis_text: 'Esta respuesta no es JSON',
  recommendations: [],
  alerts: []
});
console.log('✅ Caso 1 aprobado\n');

// Caso 2 — output_text vacío
console.log('Caso 2: output_text vacío');
const mock2 = {
  responses: {
    create: async () => ({
      output_text: ''
    })
  }
};
const resultado2 = await generarAnalisisDesdeDatos(chartData, mock2);
assert.deepStrictEqual(resultado2, {
  analysis_text: 'No se pudo generar un análisis válido.',
  recommendations: [],
  alerts: []
});
console.log('✅ Caso 2 aprobado\n');

// Caso 3 — JSON válido con tipos incorrectos
console.log('Caso 3: JSON válido con tipos incorrectos');
const mock3 = {
  responses: {
    create: async () => ({
      output_text: JSON.stringify({
        analysis_text: 'Análisis válido',
        recommendations: 'Esto debería ser un array',
        alerts: 'Esto tampoco es un array'
      })
    })
  }
};
const resultado3 = await generarAnalisisDesdeDatos(chartData, mock3);
assert.deepStrictEqual(resultado3, {
  analysis_text: 'Análisis válido',
  recommendations: [],
  alerts: []
});
console.log('✅ Caso 3 aprobado\n');

// Caso 4 — JSON válido pero incompleto
console.log('Caso 4: JSON válido pero incompleto');
const mock4 = {
  responses: {
    create: async () => ({
      output_text: JSON.stringify({
        analysis_text: 'Análisis parcial'
      })
    })
  }
};
const resultado4 = await generarAnalisisDesdeDatos(chartData, mock4);
assert.deepStrictEqual(resultado4, {
  analysis_text: 'Análisis parcial',
  recommendations: [],
  alerts: []
});
console.log('✅ Caso 4 aprobado\n');

// Caso 5 — Excepción del servicio OpenAI
console.log('Caso 5: Excepción del servicio OpenAI');
const mock5 = {
  responses: {
    create: async () => {
      throw new Error('Error simulado de OpenAI');
    }
  }
};
const resultado5 = await generarAnalisisDesdeDatos(chartData, mock5);
assert.deepStrictEqual(resultado5, {
  analysis_text: 'Ocurrió un error al generar el análisis con IA.',
  recommendations: [],
  alerts: []
});
console.log('✅ Caso 5 aprobado (console.error es esperado para este caso)\n');

console.log('PU-10 APROBADA: las respuestas inválidas y errores de OpenAI fueron manejados correctamente.');
