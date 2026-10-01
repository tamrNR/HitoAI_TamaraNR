const assert = require('assert');
const { computeMetrics } = require('../metrics.service');

// Casos de prueba para PU-05: Procesar correctamente las métricas utilizadas por el gráfico de burbujas

const chart = {
  summary: {
    resumenPorCompetencia: [
      { logroPromedio: 80 },
      { logroPromedio: 70 },
      { logroPromedio: 90 },
      { logroPromedio: 60 }
    ],
    topBrechas: [
      { competencia: 'CD1', brecha: 15 },
      { competencia: 'CD2', brecha: 25 },
      { competencia: 'CD3', brecha: 10 },
      { competencia: 'CD4', brecha: 20 }
    ],
    totalEvaluaciones: 12
  }
};

const expected = {
  totalEvaluaciones: 12,
  top3Brechas: [
    { competencia: 'CD2', brecha: 25 },
    { competencia: 'CD4', brecha: 20 },
    { competencia: 'CD1', brecha: 15 }
  ],
  promedioLogro: 75
};

const result = computeMetrics({
  chart,
  tipoGrafico: 'burbujas'
});

assert.deepStrictEqual(result, expected);

console.log('PU-05 APROBADA: las métricas agregadas del gráfico de burbujas fueron procesadas correctamente.');
