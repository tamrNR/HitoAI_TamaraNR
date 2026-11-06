// null / undefined / '' = dato faltante (NO es 0). Number(null) daría 0, por eso se descarta antes.
function toNum(v) {
  return (v === null || v === undefined || v === '') ? NaN : Number(v);
}

function safeAvg(arr = []) {
  const nums = (Array.isArray(arr) ? arr : []).map(toNum).filter(n => !Number.isNaN(n));
  if (!nums.length) return 0;
  return +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
}

function seriesStats(series = []) {
  const vals = (Array.isArray(series) ? series : []).map(toNum).filter(n => !Number.isNaN(n));
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
      const av = toNum(a[i]);
      const bv = toNum(b[i]);
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

  // Etiquetas sin dato en NINGUNA serie (null/undefined/''): la IA debe decir "No disponible"
  const sinDatos = xVals.filter((_, i) =>
    series.length > 0 && series.every(s => {
      const v = Array.isArray(s?.values) ? s.values[i] : undefined;
      return v === null || v === undefined || v === '';
    })
  );

  const out = { perSeries, comparisons };
  if (sinDatos.length) out.sinDatos = sinDatos;
  return out;
}

// Burbujas: agrega desde chart.summary (reporte) o extra.* cuando existan;
// y siempre calcula promedioLogro/min/max desde la serie "Logro" del payload
// de /analisis/ia (ignorando null). Sin fuente => las claves no existen.
function computeMetricsForBubbles(chart) {
  const extra = chart?.summary || chart?.extra || {};
  const resumen = Array.isArray(extra?.resumenPorCompetencia) ? extra.resumenPorCompetencia : null;
  const topBrechas = Array.isArray(extra?.topBrechas) ? extra.topBrechas : null;
  const out = {};

  if (topBrechas) {
    out.top3Brechas = [...topBrechas]
      .sort((a, b) => (Number(b?.brecha) || 0) - (Number(a?.brecha) || 0))
      .slice(0, 3);
  }
  if (extra?.totalEvaluaciones != null) {
    out.totalEvaluaciones = Number(extra.totalEvaluaciones) || 0;
  }
  if (resumen) {
    out.promedioLogro = safeAvg(resumen.map(r => Number(r?.logroPromedio)));
  }

  const series = Array.isArray(chart?.series) ? chart.series : [];
  const sLogro = series.find(s =>
    /logro/i.test(String(s?.name || '')) && !/distancia/i.test(String(s?.name || '')));
  if (sLogro) {
    const vals = (Array.isArray(sLogro.values) ? sLogro.values : (Array.isArray(sLogro.data) ? sLogro.data : []))
      .map(toNum).filter(n => !Number.isNaN(n));
    if (vals.length) {
      out.promedioLogro = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
      out.minLogro = Math.min(...vals);
      out.maxLogro = Math.max(...vals);
    }
  }
  return out;
}

// Brecha determinista vs umbral para los gráficos comparables con él.
// Cubiertos: radar, barras, lineas, evolucion (eje X = competencia/semestre/evaluación)
// y burbujas (eje de logro = serie "Logro"). Excluidos: heatmap (eje = personas)
// y tramos (series = distribución por tramo, no % de logro).
const TIPOS_CON_BRECHAS = new Set(['radar', 'barras', 'lineas', 'evolucion', 'burbujas', 'heatmap']);
// Barras modo curso envía '% Alumnos que cumplen umbral' (% de alumnos, no logro):
// solo estas series generan brecha vs umbral.
const SERIES_LOGRO_BARRAS = new Set(['alumno', 'promedio general', 'promedio']);
const MAX_BRECHAS_PERIODO = 120;

function calcularBrechas(chart, tipoGrafico, umbral) {
  const u = toNum(umbral);
  if (Number.isNaN(u) || !TIPOS_CON_BRECHAS.has(tipoGrafico)) return [];
  const xVals = Array.isArray(chart?.x?.values) ? chart.x.values
    : (Array.isArray(chart?.x?.labels) ? chart.x.labels : []);
  const series = Array.isArray(chart?.series) ? chart.series : [];
  const esPeriodo = tipoGrafico === 'lineas' || tipoGrafico === 'evolucion';
  const out = [];

  const pushSerie = (s) => {
    const values = Array.isArray(s?.values) ? s.values
      : (Array.isArray(s?.data) ? s.data : []);
    const nombre = s?.name || 'Serie';
    xVals.forEach((etiqueta, i) => {
      const logro = toNum(values[i]);
      if (Number.isNaN(logro)) return;
      out.push({
        serie: nombre,
        etiqueta: esPeriodo ? `${nombre} – ${etiqueta}` : etiqueta,
        brecha: +(u - logro).toFixed(1)
      });
    });
  };

  if (tipoGrafico === 'burbujas') {
    const sLogro = series.find(s =>
      /logro/i.test(String(s?.name || '')) && !/distancia/i.test(String(s?.name || '')));
    if (sLogro) pushSerie(sLogro);
    return out;
  }

  const seriesLogro = tipoGrafico === 'barras'
    ? series.filter(s => SERIES_LOGRO_BARRAS.has(String(s?.name || '').trim().toLowerCase()))
    : series;
  seriesLogro.forEach(pushSerie);
  if (esPeriodo) {
    out.sort((a, b) => b.brecha - a.brecha);
    return out.slice(0, MAX_BRECHAS_PERIODO);
  }
  return out;
}

// Etiquetas del eje X sin dato en NINGUNA serie (null/undefined/'')
function calcularSinDatos(chart) {
  const xVals = Array.isArray(chart?.x?.values) ? chart.x.values
    : (Array.isArray(chart?.x?.labels) ? chart.x.labels : []);
  const series = Array.isArray(chart?.series) ? chart.series : [];
  return xVals.filter((_, i) =>
    series.length > 0 && series.every(s => {
      const vals = Array.isArray(s?.values) ? s.values : (Array.isArray(s?.data) ? s.data : []);
      const v = vals[i];
      return v === null || v === undefined || v === '';
    }));
}

function computeMetrics({ chart, tipoGrafico, umbral }) {
  try {
    if (!chart || !tipoGrafico) return {};
    if (tipoGrafico === 'radar' || tipoGrafico === 'barras') {
      const metrics = computeMetricsForXY(chart);
      metrics.brechas = calcularBrechas(chart, tipoGrafico, umbral);
      return metrics;
    }
    if (tipoGrafico === 'burbujas') {
      const metrics = computeMetricsForBubbles(chart);
      metrics.brechas = calcularBrechas(chart, tipoGrafico, umbral);
      const sd = calcularSinDatos(chart);
      if (sd.length) metrics.sinDatos = sd;
      return metrics;
    }
    if (tipoGrafico === 'lineas' || tipoGrafico === 'evolucion' || tipoGrafico === 'heatmap') {
      const out = { brechas: calcularBrechas(chart, tipoGrafico, umbral) };
      const sd = calcularSinDatos(chart);
      if (sd.length) out.sinDatos = sd;
      return out;
    }
    return {};
  } catch (e) {
    console.error('[metrics.service] Error computeMetrics:', e?.message || e);
    return {};
  }
}

module.exports = { computeMetrics };
