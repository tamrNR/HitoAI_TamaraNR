// ===============================
// PU-09: Procesar correctamente una respuesta válida de OpenAI
// ===============================
import assert from 'node:assert';
import { generarAnalisisDesdeDatos } from '../openai.service.js';

console.log('Ejecutando PU-09: Procesar respuesta válida de OpenAI...\n');

// Cliente OpenAI simulado
let llamadaRealizada = false;

const mockOpenAI = {
  responses: {
    create: async () => {
      llamadaRealizada = true;

      return {
        output_text: JSON.stringify({
          analysis_text:
            'El rendimiento general es del 75%, con fortalezas en competencias técnicas.',
          recommendations: [
            'Reforzar competencias blandas',
            'Implementar tutorías personalizadas'
          ],
          alerts: [
            'Bajo rendimiento en comunicación interpersonal'
          ]
        })
      };
    }
  }
};

// Datos controlados
const resultado = await generarAnalisisDesdeDatos(
  {
    chart: {
      x: {
        values: ['CD1']
      },
      series: [
        {
          name: 'Alumno',
          unit: '%',
          values: [75]
        }
      ]
    },
    context: {
      tipoGrafico: 'radar'
    }
  },
  mockOpenAI
);

// Verificar resultado esperado
assert.deepStrictEqual(resultado, {
  analysis_text:
    'El rendimiento general es del 75%, con fortalezas en competencias técnicas.',
  recommendations: [
    'Reforzar competencias blandas',
    'Implementar tutorías personalizadas'
  ],
  alerts: [
    'Bajo rendimiento en comunicación interpersonal'
  ]
});

// Verificar que se utilizó el cliente simulado
assert.strictEqual(llamadaRealizada, true);

console.log('PU-09 APROBADA: la respuesta válida simulada de OpenAI fue procesada correctamente.');
