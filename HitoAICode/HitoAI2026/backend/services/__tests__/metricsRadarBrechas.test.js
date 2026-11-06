// ===============================
// PU-13: Brechas del radar (umbral - logro) por serie en computed.brechas
// ===============================
const assert = require('assert');
const { computeMetrics } = require('../metrics.service');

console.log('Ejecutando PU-13: brechas del radar por serie...\n');

// Caso 1 — el umbral llega por PARÁMETRO (el chart NO trae extra.umbral),
// 2 series y un null que debe omitirse
const chart = {
  x: { values: ['CD1', 'CD2', 'CD3'] },
  series: [
    { name: 'Alumno',   values: [72, null, 60] },
    { name: 'Promedio', values: [80, 70, 55] }
  ]
};
const m = computeMetrics({ chart, tipoGrafico: 'radar', umbral: 75 });
assert.deepStrictEqual(m.brechas, [
  { serie: 'Alumno',   etiqueta: 'CD1', brecha: 3  },
  { serie: 'Alumno',   etiqueta: 'CD3', brecha: 15 },
  { serie: 'Promedio', etiqueta: 'CD1', brecha: -5 },
  { serie: 'Promedio', etiqueta: 'CD2', brecha: 5  },
  { serie: 'Promedio', etiqueta: 'CD3', brecha: 20 }
]);
console.log('✅ Caso 1 aprobado: brecha por serie, umbral por parámetro, null omitido, sobre umbral da negativo\n');

// Caso 2 — radar sin umbral (ni parámetro ni chart.extra) => []
const m2 = computeMetrics({ chart, tipoGrafico: 'radar' });
assert.deepStrictEqual(m2.brechas, []);
console.log('✅ Caso 2 aprobado: sin umbral numérico => brechas []\n');

// Caso 3 — barras también lleva brechas (umbral - logro por serie)
const mb = computeMetrics({ chart, tipoGrafico: 'barras', umbral: 75 });
assert.deepStrictEqual(mb.brechas, [
  { serie: 'Alumno',   etiqueta: 'CD1', brecha: 3  },
  { serie: 'Alumno',   etiqueta: 'CD3', brecha: 15 },
  { serie: 'Promedio', etiqueta: 'CD1', brecha: -5 },
  { serie: 'Promedio', etiqueta: 'CD2', brecha: 5  },
  { serie: 'Promedio', etiqueta: 'CD3', brecha: 20 }
]);
console.log('✅ Caso 3 aprobado: barras incluye brechas por serie\n');

console.log('PU-13 APROBADA: las brechas del radar se calculan por serie como umbral - logro.');
