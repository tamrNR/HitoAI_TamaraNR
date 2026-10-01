const assert = require('assert');
const { computeMetrics } = require('../metrics.service');

// Casos de prueba para PU-06: Seleccionar correctamente el procesamiento requerido según el tipo de gráfico

// Datos para radar y barras
const chartXY = {
  x: { values: ['CD1', 'CD2'] },
  series: [
    { name: 'Alumno', unit: '%', values: [80, 70] },
    { name: 'Promedio', unit: '%', values: [75, 65] }
  ]
};

const esperadoXY = {
  perSeries: [
    {
      name: 'Alumno',
      unit: '%',
      stats: { avg: 75, min: 70, max: 80 }
    },
    {
      name: 'Promedio',
      unit: '%',
      stats: { avg: 70, min: 65, max: 75 }
    }
  ],
  comparisons: {
    gapPromedio: 5,
    topGapsNegativos: []
  }
};

// Datos para burbujas
const chartBurbujas = {
  summary: {
    resumenPorCompetencia: [
      { logroPromedio: 80 }
    ],
    topBrechas: [
      { competencia: 'CD1', brecha: 15 }
    ],
    totalEvaluaciones: 5
  }
};

const esperadoBurbujas = {
  totalEvaluaciones: 5,
  top3Brechas: [
    { competencia: 'CD1', brecha: 15 }
  ],
  promedioLogro: 80
};

// Caso 1: radar
assert.deepStrictEqual(
  computeMetrics({ chart: chartXY, tipoGrafico: 'radar' }),
  esperadoXY
);

// Caso 2: barras
assert.deepStrictEqual(
  computeMetrics({ chart: chartXY, tipoGrafico: 'barras' }),
  esperadoXY
);

// Caso 3: burbujas
assert.deepStrictEqual(
  computeMetrics({ chart: chartBurbujas, tipoGrafico: 'burbujas' }),
  esperadoBurbujas
);

// Caso 4: tipo no soportado (lineas)
assert.deepStrictEqual(
  computeMetrics({ chart: chartXY, tipoGrafico: 'lineas' }),
  {}
);

// Caso 5: tipoGrafico undefined
assert.deepStrictEqual(
  computeMetrics({ chart: chartXY, tipoGrafico: undefined }),
  {}
);

// Caso 6: mayúsculas (RADAR no es reconocido)
assert.deepStrictEqual(
  computeMetrics({ chart: chartXY, tipoGrafico: 'RADAR' }),
  {}
);

console.log('PU-06 APROBADA: la selección del procesamiento según el tipo de gráfico funciona correctamente.');
