const assert = require('assert');
const { computeMetrics } = require('../metrics.service');

// Casos de prueba para PU-04: Procesar correctamente las métricas utilizadas por los gráficos radar y barras

const chart = {
  x: {
    values: ['CD1', 'CD2', 'CD3']
  },
  series: [
    {
      name: 'Alumno',
      unit: '%',
      values: [80, 70, 90]
    },
    {
      name: 'Promedio General',
      unit: '%',
      values: [75, 65, 85]
    }
  ]
};

const expected = {
  perSeries: [
    {
      name: 'Alumno',
      unit: '%',
      stats: {
        avg: 80,
        min: 70,
        max: 90
      }
    },
    {
      name: 'Promedio General',
      unit: '%',
      stats: {
        avg: 75,
        min: 65,
        max: 85
      }
    }
  ],
  comparisons: {
    gapPromedio: 5,
    topGapsNegativos: []
  }
};

// Caso 1: tipoGrafico 'radar'
const resultRadar = computeMetrics({ chart, tipoGrafico: 'radar' });
assert.deepStrictEqual(resultRadar, expected);

// Caso 2: tipoGrafico 'barras'
const resultBarras = computeMetrics({ chart, tipoGrafico: 'barras' });
assert.deepStrictEqual(resultBarras, expected);

console.log('PU-04 APROBADA: las métricas para radar y barras fueron procesadas correctamente.');
