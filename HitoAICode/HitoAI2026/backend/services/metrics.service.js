function safeAvg(arr = []) {
  const nums = (Array.isArray(arr) ? arr : []).map(Number).filter(n => !Number.isNaN(n));
  if (!nums.length) return 0;
  return +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
}

function seriesStats(series = []) {
  const vals = (Array.isArray(series) ? series : []).map(Number).filter(n => !Number.isNaN(n));
  if (!vals.length) return { avg: 0, min: 0, max: 0 };
  const avg = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return { avg, min, max };
}

function computeMetricsForXY(chart) {
  const xVals = Array.isArray(chart?.x?.values) ? chart.x.values : [];
  const series = Array.isArray(chart?.series) ? chart.series : [];

  const perSeries = series.map(s => ({
    name: s?.name || 'Serie',
    unit: s?.unit || '',
    stats: seriesStats(s?.values)
  }));

  let comparisons = undefined;
  if (series.length >= 2) {
    // Suponemos Alumno vs Promedio si hay 2 series
    const a = series[0]?.values || [];
    const b = series[1]?.values || [];
    const len = Math.min(a.length, b.length);
    const diffs = [];
    const gaps = [];
    for (let i = 0; i < len; i++) {
      const av = Number(a[i]);
      const bv = Number(b[i]);
      if (!Number.isNaN(av) && !Number.isNaN(bv)) {
        const d = +(av - bv).toFixed(2);
        diffs.push(d);
        gaps.push({ etiqueta: xVals[i], gap: d });
      }
    }
    const gapPromedio = safeAvg(diffs);
    const topNegativos = gaps
      .filter(g => typeof g.gap === 'number' && g.gap < 0)
      .sort((g1, g2) => g1.gap - g2.gap) // más negativo primero
      .slice(0, 3);
    comparisons = { gapPromedio, topGapsNegativos: topNegativos };
  }

  return { perSeries, comparisons };
}

function computeMetricsForBubbles(chart) {
  const extra = chart?.summary || chart?.extra || {};
  const resumen = Array.isArray(extra?.resumenPorCompetencia) ? extra.resumenPorCompetencia : [];
  const topBrechas = Array.isArray(extra?.topBrechas) ? extra.topBrechas : [];

  const top3 = [...topBrechas]
    .sort((a, b) => (Number(b?.brecha) || 0) - (Number(a?.brecha) || 0))
    .slice(0, 3);

  const promedioLogro = safeAvg(resumen.map(r => Number(r?.logroPromedio)));

  return {
    totalEvaluaciones: Number(extra?.totalEvaluaciones) || 0,
    top3Brechas: top3,
    promedioLogro
  };
}

function computeMetrics({ chart, tipoGrafico }) {
  try {
    if (!chart || !tipoGrafico) return {};
    if (tipoGrafico === 'radar' || tipoGrafico === 'barras') {
      return computeMetricsForXY(chart);
    }
    if (tipoGrafico === 'burbujas') {
      return computeMetricsForBubbles(chart);
    }
    return {};
  } catch (e) {
    console.error('[metrics.service] Error computeMetrics:', e?.message || e);
    return {};
  }
}

module.exports = { computeMetrics };
