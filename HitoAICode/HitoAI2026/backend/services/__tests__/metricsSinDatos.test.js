// ===============================
// PU-16: sinDatos en computed para lineas, evolucion y burbujas
// ===============================
const assert = require('assert');
const { computeMetrics } = require('../metrics.service');

console.log('Ejecutando PU-16: sinDatos en computed (null = No disponible)...\n');

// Caso 1 — lineas: el null no genera brecha y el período queda en sinDatos
let m = computeMetrics({
  chart: {
    x: { label: 'Semestre', values: ['Semestre 1', 'Semestre 2'] },
    series: [{ name: 'CP2', unit: '%', values: [null, 40] }]
  },
  tipoGrafico: 'lineas',
  umbral: 50
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'CP2', etiqueta: 'CP2 – Semestre 2', brecha: 10 }
]);
assert.deepStrictEqual(m.sinDatos, ['Semestre 1']);
console.log('✅ Caso 1 aprobado: lineas omite null en brechas y reporta sinDatos\n');

// Caso 2 — evolucion: mismo comportamiento con etiquetas de evaluación
m = computeMetrics({
  chart: {
    x: { label: 'Evaluación', values: ['E1', 'E2'] },
    series: [{ name: 'CS', values: [null, 90] }]
  },
  tipoGrafico: 'evolucion',
  umbral: 70
});
assert.deepStrictEqual(m.sinDatos, ['E1']);
assert.deepStrictEqual(m.brechas, [
  { serie: 'CS', etiqueta: 'CS – E2', brecha: -20 }
]);
console.log('✅ Caso 2 aprobado: evolucion reporta sinDatos por evaluación\n');

// Caso 3 — burbujas: punto sin datos en AMBAS series => sinDatos; brecha solo del logro
m = computeMetrics({
  chart: {
    x: { values: ['CP2', 'CD1'] },
    series: [
      { name: 'Logro (%)', unit: '%', values: [null, 60] },
      { name: 'Distancia al umbral (%)', unit: '%', values: [null, -15] }
    ]
  },
  tipoGrafico: 'burbujas',
  umbral: 75
});
assert.deepStrictEqual(m.sinDatos, ['CP2']);
assert.deepStrictEqual(m.brechas, [
  { serie: 'Logro (%)', etiqueta: 'CD1', brecha: 15 }
]);
console.log('✅ Caso 3 aprobado: burbujas con sinDatos cuando todas las series faltan\n');

// Caso 4 — TODAS las series null en TODOS los puntos:
// sinDatos.length === etiquetas.length => el controller cortocircuita
// con "No disponible" SIN llamar a OpenAI
const todosNull = computeMetrics({
  chart: {
    x: { values: ['A', 'B'] },
    series: [{ name: 'S', values: [null, null] }]
  },
  tipoGrafico: 'lineas',
  umbral: 50
});
assert.deepStrictEqual(todosNull.sinDatos, ['A', 'B']);
assert.strictEqual(todosNull.sinDatos.length, 2);
assert.deepStrictEqual(todosNull.brechas, []);
console.log('✅ Caso 4 aprobado: todo null => sinDatos cubre todas las etiquetas (cortocircuito)\n');

console.log('PU-16 APROBADA: los puntos sin evaluación llegan como null y computed.sinDatos los reporta.');
