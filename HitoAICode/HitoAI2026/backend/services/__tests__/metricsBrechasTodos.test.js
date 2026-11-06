// ===============================
// PU-14: Brechas vs umbral en TODOS los tipos de gráfico comparables
// ===============================
const assert = require('assert');
const { computeMetrics } = require('../metrics.service');

console.log('Ejecutando PU-14: brechas por tipo de gráfico...\n');

// Caso 1 — radar: una entrada por serie x competencia
let m = computeMetrics({
  chart: {
    x: { values: ['CD1', 'CD2'] },
    series: [{ name: 'Alumno', values: [70, 90] }]
  },
  tipoGrafico: 'radar',
  umbral: 80
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'Alumno', etiqueta: 'CD1', brecha: 10 },
  { serie: 'Alumno', etiqueta: 'CD2', brecha: -10 }
]);
console.log('✅ Caso 1 aprobado: radar con brechas por serie\n');

// Caso 2 — barras: también comparables con el umbral
m = computeMetrics({
  chart: {
    x: { values: ['CD1'] },
    series: [{ name: 'Promedio', values: [60] }]
  },
  tipoGrafico: 'barras',
  umbral: 75
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'Promedio', etiqueta: 'CD1', brecha: 15 }
]);
console.log('✅ Caso 2 aprobado: barras con brechas\n');

// Caso 3 — lineas: etiqueta "<serie> – <periodo>", ordenadas por mayor brecha
m = computeMetrics({
  chart: {
    x: { values: ['2024-1', '2024-2'] },
    series: [
      { name: 'CD1', values: [50, 70] },
      { name: 'CD2', values: [90, 80] }
    ]
  },
  tipoGrafico: 'lineas',
  umbral: 75
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'CD1', etiqueta: 'CD1 – 2024-1', brecha: 25 },
  { serie: 'CD1', etiqueta: 'CD1 – 2024-2', brecha: 5 },
  { serie: 'CD2', etiqueta: 'CD2 – 2024-2', brecha: -5 },
  { serie: 'CD2', etiqueta: 'CD2 – 2024-1', brecha: -15 }
]);
console.log('✅ Caso 3 aprobado: lineas con etiqueta serie–periodo y orden por brecha\n');

// Caso 4a — lineas: más de 120 puntos => exactamente 120, ordenados por mayor brecha
const excede = computeMetrics({
  chart: {
    x: { values: Array.from({ length: 130 }, (_, i) => `P${i + 1}`) },
    series: [{ name: 'CD1', values: Array(130).fill(50) }]
  },
  tipoGrafico: 'lineas',
  umbral: 75
});
assert.strictEqual(excede.brechas.length, 120);
assert.ok(excede.brechas.every(b => b.brecha === 25));
console.log('✅ Caso 4a aprobado: lineas limitado a 120 brechas\n');

// Caso 4b — evolucion: 12 evaluaciones × 8 competencias = 96 => se devuelven todos
const evals96 = computeMetrics({
  chart: {
    x: { values: Array.from({ length: 12 }, (_, i) => `E${i + 1}`) },
    series: Array.from({ length: 8 }, (_, i) => ({
      name: `CD${i + 1}`, values: Array(12).fill(50)
    }))
  },
  tipoGrafico: 'evolucion',
  umbral: 75
});
assert.strictEqual(evals96.brechas.length, 96);
console.log('✅ Caso 4b aprobado: evolucion con 96 puntos devuelve todos\n');

// Caso 5 — evolucion: mismo formato que lineas
m = computeMetrics({
  chart: {
    x: { values: ['E1', 'E2'] },
    series: [{ name: 'CD3', values: [40, 85] }]
  },
  tipoGrafico: 'evolucion',
  umbral: 70
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'CD3', etiqueta: 'CD3 – E1', brecha: 30 },
  { serie: 'CD3', etiqueta: 'CD3 – E2', brecha: -15 }
]);
console.log('✅ Caso 5 aprobado: evolucion con brechas por evaluación\n');

// Caso 6 — burbujas: solo la serie "Logro", ignora "Distancia"
m = computeMetrics({
  chart: {
    x: { values: ['CD1', 'CD2'] },
    series: [
      { name: 'Logro (%)', unit: '%', values: [70, 95] },
      { name: 'Distancia al umbral (%)', unit: '%', values: [5, -20] }
    ]
  },
  tipoGrafico: 'burbujas',
  umbral: 75
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'Logro (%)', etiqueta: 'CD1', brecha: 5 },
  { serie: 'Logro (%)', etiqueta: 'CD2', brecha: -20 }
]);
console.log('✅ Caso 6 aprobado: burbujas usa solo la serie de logro\n');

// Caso 7 — burbujas sin serie "logro" => []
m = computeMetrics({
  chart: {
    x: { values: ['CD1'] },
    series: [{ name: 'Distancia al umbral (%)', values: [5] }]
  },
  tipoGrafico: 'burbujas',
  umbral: 75
});
assert.deepStrictEqual(m.brechas, []);
console.log('✅ Caso 7 aprobado: burbujas sin serie logro => []\n');

// Caso 8 — tramos sigue excluido; heatmap SÍ tiene brechas (serie de logro promedio,
// con etiquetas ya anonimizadas "Estudiante N" cuando viene del flujo /analisis/ia)
assert.deepStrictEqual(
  computeMetrics({ chart: { x: { values: ['CD1'] }, series: [{ name: 'Satisfactorio %', values: [30] }] }, tipoGrafico: 'tramos', umbral: 75 }),
  {}
);
m = computeMetrics({
  chart: {
    x: { values: ['TIS800', 'Estudiante 1', 'Estudiante 2'] },
    series: [{ name: 'Logro Promedio (%)', values: [72, 80, 65] }]
  },
  tipoGrafico: 'heatmap',
  umbral: 75
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'Logro Promedio (%)', etiqueta: 'TIS800', brecha: 3 },
  { serie: 'Logro Promedio (%)', etiqueta: 'Estudiante 1', brecha: -5 },
  { serie: 'Logro Promedio (%)', etiqueta: 'Estudiante 2', brecha: 10 }
]);
console.log('✅ Caso 8 aprobado: tramos excluido, heatmap con brechas y etiquetas anonimizadas\n');

// Caso 8b — barras modo curso: '% Alumnos que cumplen umbral' NO es logro => sin brechas;
// solo las series de logro ('Alumno', 'Promedio General') generan brecha
m = computeMetrics({
  chart: {
    x: { values: ['CD1', 'CD2'] },
    series: [{ name: '% Alumnos que cumplen umbral', values: [40, 60] }]
  },
  tipoGrafico: 'barras',
  umbral: 52
});
assert.deepStrictEqual(m.brechas, []);
m = computeMetrics({
  chart: {
    x: { values: ['CD1'] },
    series: [
      { name: '% Alumnos que cumplen umbral', values: [40] },
      { name: 'Alumno', values: [50] },
      { name: 'Promedio General', values: [70] }
    ]
  },
  tipoGrafico: 'barras',
  umbral: 52
});
assert.deepStrictEqual(m.brechas, [
  { serie: 'Alumno', etiqueta: 'CD1', brecha: 2 },
  { serie: 'Promedio General', etiqueta: 'CD1', brecha: -18 }
]);
console.log('✅ Caso 8b aprobado: barras curso sin brecha, barras alumno solo series de logro\n');

// Caso 9 — umbral ausente/no numérico => [] en tipos cubiertos
assert.deepStrictEqual(
  computeMetrics({ chart: { x: { values: ['CD1'] }, series: [{ name: 'A', values: [50] }] }, tipoGrafico: 'radar' }).brechas,
  []
);
assert.deepStrictEqual(
  computeMetrics({ chart: { x: { values: ['CD1'] }, series: [{ name: 'A', values: [50] }] }, tipoGrafico: 'barras', umbral: 'alto' }).brechas,
  []
);
console.log('✅ Caso 9 aprobado: sin umbral numérico => []\n');

console.log('PU-14 APROBADA: brechas deterministas en radar, barras, lineas, evolucion y burbujas.');
