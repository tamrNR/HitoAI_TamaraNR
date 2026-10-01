const assert = require('assert');
const { calcularResumenCompetencias } = require('../resumenCompetencias');

// Helper to find a row by competencia
function row(resumen, competencia) {
  return resumen.find(r => r.competencia === competencia);
}

// Test counting full points for each competencia when multiple competencias are present
const resumen = calcularResumenCompetencias([
  { puntaje_maximo: 10, promedio_obtenido: 8, competencias: 'C1 + C2' },
  { puntaje_maximo: 5, promedio_obtenido: 2, competencias: 'C1' }
]);

const c1 = row(resumen, 'C1');
const c2 = row(resumen, 'C2');
const total = row(resumen, 'Total');

assert.strictEqual(c1.puntajeIdeal, 15);
assert.strictEqual(c1.promedio, 10);
assert.strictEqual(c2.puntajeIdeal, 10);
assert.strictEqual(c2.promedio, 8);
assert.strictEqual(total.puntajeIdeal, 25);
assert.strictEqual(total.promedio, 18);

console.log('All tests passed');

