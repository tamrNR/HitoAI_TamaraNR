// ===============================
// PU-11: Datos faltantes ("No disponible") y reglas del prompt v2
// ===============================
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { generarAnalisisDesdeDatos } from '../openai.service.js';

const require = createRequire(import.meta.url);
const { computeMetrics } = require('../metrics.service.js');

console.log('Ejecutando PU-11: datos faltantes y prompt v2...\n');

// Caso 1 — null NO se cuenta como 0 y se informa en sinDatos
const chart = {
  x: { values: ['CD1', 'CD2', 'CD3'] },
  series: [{ name: 'Alumno', unit: '%', values: [72, null, 60] }]
};
const m = computeMetrics({ chart, tipoGrafico: 'radar' });
assert.strictEqual(m.perSeries[0].stats.avg, 66);   // (72+60)/2, no (72+0+60)/3
assert.strictEqual(m.perSeries[0].stats.min, 60);
assert.deepStrictEqual(m.sinDatos, ['CD2']);
console.log('✅ Caso 1 aprobado: null excluido del cálculo y listado en sinDatos\n');

// Caso 2 — sin faltantes no aparece la clave sinDatos
const m2 = computeMetrics({
  chart: { x: { values: ['A'] }, series: [{ name: 'Alumno', values: [80] }] },
  tipoGrafico: 'radar'
});
assert.ok(!('sinDatos' in m2));
console.log('✅ Caso 2 aprobado: sin faltantes no hay sinDatos\n');

// Caso 3 — el prompt enviado contiene las reglas obligatorias
let enviado = null;
const mock = { responses: { create: async (args) => { enviado = args; return { output_text: '{"analysis_text":"ok","recommendations":[],"alerts":[]}' }; } } };
await generarAnalisisDesdeDatos({ chart: { ...chart, computed: m }, context: { umbral: 60 } }, mock);
const sistema = enviado.input.find(i => i.role === 'system').content;
for (const frase of ['No disponible', 'No calcules ni estimes', 'sinDatos', 'umbral', 'TODAS las series', 'Ejemplo de salida']) {
  assert.ok(sistema.includes(frase), `El prompt debe incluir: ${frase}`);
}
assert.strictEqual(enviado.text.format.strict, true);
console.log('✅ Caso 3 aprobado: prompt v2 con reglas y ejemplo, salida JSON estricta\n');

// Caso 4 — la regla 7 instruye cómo citar brechas (positivas, negativas, unidad, sin repetir etiquetas)
for (const frase of [
  'puntos bajo el umbral',
  'puntos sobre el umbral',
  'valor absoluto',
  'umbral 51 %',
  'No repitas entre paréntesis',
  'una sola serie'
]) {
  assert.ok(sistema.includes(frase), `La regla 7 debe incluir: ${frase}`);
}
console.log('✅ Caso 4 aprobado: regla 7 con instrucciones de brechas positivas/negativas\n');

console.log('PU-11 APROBADA: los datos faltantes se tratan como "No disponible" y el prompt incluye las reglas.');
