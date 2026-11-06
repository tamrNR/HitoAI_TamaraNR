// ===============================
// PU-08: Manejo de datos vacíos, incompletos o inválidos en computeMetrics()
// ===============================
const assert = require('assert');
const { computeMetrics } = require('../metrics.service');

console.log('Ejecutando PU-08: Manejo de datos vacíos, incompletos e inválidos...\n');

// Caso 1 — chart nulo
console.log('Caso 1: chart nulo con tipoGrafico válido');
const resultado1 = computeMetrics({ chart: null, tipoGrafico: 'radar' });
assert.deepStrictEqual(resultado1, {});
console.log('✅ Caso 1 aprobado\n');

// Caso 2 — chart vacío para radar
console.log('Caso 2: chart vacío para radar');
const resultado2 = computeMetrics({ chart: {}, tipoGrafico: 'radar' });
assert.deepStrictEqual(resultado2, {
  perSeries: [],
  comparisons: undefined,
  brechas: []
});
console.log('✅ Caso 2 aprobado\n');

// Caso 3 — serie sin valores
console.log('Caso 3: serie sin valores');
const chartSinValores = {
  x: { values: [] },
  series: [
    { name: 'Alumno', unit: '%', values: [] }
  ]
};
const resultado3 = computeMetrics({ chart: chartSinValores, tipoGrafico: 'radar' });
assert.deepStrictEqual(resultado3, {
  perSeries: [
    {
      name: 'Alumno',
      unit: '%',
      stats: { avg: 0, min: 0, max: 0 }
    }
  ],
  comparisons: undefined,
  brechas: []
});
console.log('✅ Caso 3 aprobado\n');

// Caso 4 — valores inválidos
console.log('Caso 4: valores inválidos (null, undefined, texto no numérico, NaN)');
const chartInvalidos = {
  x: { values: ['A', 'B', 'C', 'D', 'E'] },
  series: [
    {
      name: 'Alumno',
      unit: '%',
      values: [null, undefined, 'abc', NaN, 50]
    }
  ]
};
const resultado4 = computeMetrics({ chart: chartInvalidos, tipoGrafico: 'radar' });
// COMPORTAMIENTO v2: null/undefined = dato faltante (NO es 0). Se excluyen del cálculo
// y se informan en sinDatos. 'abc' y NaN siguen filtrándose como inválidos.
// Resultado: solo cuenta el 50 -> avg: 50, min: 50, max: 50
assert.deepStrictEqual(resultado4, {
  perSeries: [
    {
      name: 'Alumno',
      unit: '%',
      stats: { avg: 50, min: 50, max: 50 }
    }
  ],
  comparisons: undefined,
  sinDatos: ['A', 'B'],
  brechas: []
});
console.log('✅ Caso 4 aprobado (null = dato faltante, informado en sinDatos)\n');

// Caso 5 — burbujas sin información
console.log('Caso 5: burbujas sin información');
const resultado5 = computeMetrics({
  chart: {
    summary: {
      resumenPorCompetencia: [],
      topBrechas: []
    }
  },
  tipoGrafico: 'burbujas'
});
assert.deepStrictEqual(resultado5, {
  top3Brechas: [],
  promedioLogro: 0,
  brechas: []
});
console.log('✅ Caso 5 aprobado\n');

// Caso 6 — tipo de gráfico ausente
console.log('Caso 6: tipo de gráfico ausente');
const resultado6 = computeMetrics({ chart: {}, tipoGrafico: undefined });
assert.deepStrictEqual(resultado6, {});
console.log('✅ Caso 6 aprobado\n');

console.log('PU-08 APROBADA: los datos vacíos, incompletos e inválidos fueron manejados correctamente.');
