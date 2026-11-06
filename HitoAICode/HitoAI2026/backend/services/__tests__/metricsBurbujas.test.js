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
  promedioLogro: 75,
  brechas: []
};

const result = computeMetrics({
  chart,
  tipoGrafico: 'burbujas'
});

assert.deepStrictEqual(result, expected);
console.log('✅ Caso 1 aprobado: métricas desde chart.summary\n');

// Caso 2 — payload de /analisis/ia (sin summary ni extra.*):
// stats desde la serie "Logro (%)" ignorando null; sin totalEvaluaciones ni top3Brechas falsos
const payloadAnalisis = computeMetrics({
  chart: {
    x: { label: 'Competencia', values: ['CP2', 'CD1', 'CS'] },
    series: [
      { name: 'Logro (%)', unit: '%', values: [null, 60, 90] },
      { name: 'Distancia al umbral (%)', unit: '%', values: [null, -15, 15] }
    ]
  },
  tipoGrafico: 'burbujas',
  umbral: 75
});
assert.ok(!('totalEvaluaciones' in payloadAnalisis), 'no debe inventar totalEvaluaciones');
assert.ok(!('top3Brechas' in payloadAnalisis), 'no debe inventar top3Brechas');
assert.strictEqual(payloadAnalisis.promedioLogro, 75);
assert.strictEqual(payloadAnalisis.minLogro, 60);
assert.strictEqual(payloadAnalisis.maxLogro, 90);
assert.deepStrictEqual(payloadAnalisis.sinDatos, ['CP2']);
console.log('✅ Caso 2 aprobado: payload sin extra.* usa la serie Logro y no produce ceros falsos\n');

console.log('PU-05 APROBADA: las métricas agregadas del gráfico de burbujas fueron procesadas correctamente.');
