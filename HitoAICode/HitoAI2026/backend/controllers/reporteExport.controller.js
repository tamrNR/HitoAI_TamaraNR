const { computeMetrics } = require('../services/metrics.service');
const { buildFiltrosHash } = require('../utils/hash.util');
const { findByHash, insertAnalisis } = require('../services/aiAnalisis.repository');
const { generarResumenCriticoBatch } = require('../services/openai.service');
const {
  generarGraficoRadar,
  generarGraficoBurbujas,
  generarGraficoBarrasComparativa,
  generarGraficoTrayectoria,
  generarGraficoEvolucion,
} = require('../utils/grafico');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Helper function to calculate real fallback
function buildFallback(m) {
  const c = m.chart || {};
  let label = '';
  let valor = null;
  
  if (Array.isArray(c.series) && c.series.length >= 2 && Array.isArray(c.x?.labels)) {
    const a = c.series[0]?.data || [];
    const b = c.series[1]?.data || [];
    let minGap = Infinity, minIdx = -1;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const gap = Number(a[i]) - Number(b[i]);
      if (gap < minGap) { minGap = gap; minIdx = i; }
    }
    label = c.x.labels[minIdx] || '';
    valor = typeof a[minIdx] === 'number' ? a[minIdx] : Number(a[minIdx]) || null;
  } else if (Array.isArray(c.series) && c.series.length === 1 && Array.isArray(c.x?.labels)) {
    const a = c.series[0]?.data || [];
    let minVal = Infinity, minIdx = -1;
    for (let i = 0; i < a.length; i++) {
      const v = Number(a[i]);
      if (!Number.isNaN(v) && v < minVal) { minVal = v; minIdx = i; }
    }
    label = c.x.labels[minIdx] || '';
    valor = minVal !== Infinity ? minVal : null;
  } else if (m.tipoGrafico === 'burbujas' && Array.isArray(c.extra?.items)) {
    let maxDistancia = -Infinity, pick = null;
    for (const it of c.extra.items) {
      const dist = Number(it.y) || 0;
      if (!Number.isNaN(dist) && dist > maxDistancia) { maxDistancia = dist; pick = it; }
    }
    label = pick?.competencia || '';
    valor = typeof pick?.x === 'number' ? pick.x : null;
  }
  
  const valText = (valor !== null && valor !== undefined) ? `${valor}%` : 'un nivel bajo';
  return {
    critico: `Mejorar ${label}: actualmente ${valText}`,
    solucion: 'Priorizar reforzamiento y práctica dirigida en esta competencia.'
  };
}

// Helper function to convert image to base64
function imageToBase64(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) return null;
    const buffer = fs.readFileSync(imagePath);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  } catch (e) {
    console.warn('[ReporteExport] ⚠️ Error convirtiendo imagen a base64:', e?.message || e);
    return null;
  }
}

// Helper function to get color for heatmap value
function getHeatmapColor(logro) {
  const n = Number(logro);
  if (n >= 90) return '#4CAF50'; // Excelente - green
  if (n >= 75) return '#8BC34A'; // Alto - green-blue
  if (n >= 50) return '#FFC107'; // Medio - yellow
  return '#F44336'; // Bajo - red
}

// Helper function to get text color for heatmap
function getHeatmapTextColor(logro) {
  const n = Number(logro);
  if (n >= 75) return '#FFFFFF'; // White text for green backgrounds
  return '#000000'; // Black text for yellow/red backgrounds
}

// Gradiente continuo rojo→amarillo→verde, igual que en el frontend
function rgbDegradadoHeatmap(valor) {
  const clamped = Math.max(0, Math.min(100, Number(valor) || 0));
  if (clamped <= 50) {
    const t = clamped / 50;
    return [
      Math.round(211 + (255 - 211) * t),
      Math.round(47 + (193 - 47) * t),
      Math.round(47 + (7 - 47) * t)
    ];
  }
  const t = (clamped - 50) / 50;
  return [
    Math.round(255 + (76 - 255) * t),
    Math.round(193 + (175 - 193) * t),
    Math.round(7 + (80 - 7) * t)
  ];
}

function getHeatmapColorDegradado(logro) {
  const [r, g, b] = rgbDegradadoHeatmap(logro);
  return `rgb(${r}, ${g}, ${b})`;
}

function getHeatmapTextColorDegradado(logro) {
  const [r, g, b] = rgbDegradadoHeatmap(logro);
  const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminancia > 150 ? '#333333' : '#FFFFFF';
}

exports.generarReporteAnalitica = async (req, res) => {
  try {
    const { charts = [], meta = {} } = req.body;

    if (!charts.length) {
      return res.status(400).json({ message: 'No se proporcionaron gráficos' });
    }

    const promptVersion = 'export_v1';
    const hits = [];
    const misses = [];

    // Process each chart for AI analysis
    console.time('[Timing] 1-Consulta caché IA');
    await Promise.all(charts.map(async (item) => {
      const id = String(item?.id || '');
      const tipoGrafico = String(item?.tipoGrafico || '').trim();
      const chart = item?.chart || {};
      const context = item?.context || {};

      const metrics = computeMetrics({ chart, tipoGrafico });
      const chartEnriched = { ...chart, computed: metrics };

      const filtrosHash = buildFiltrosHash({ tipoGrafico, context, chart: chartEnriched, promptVersion });

      try {
        const cached = await findByHash(tipoGrafico, filtrosHash);
        if (cached && cached.status === 'ok') {
          let critico = '';
          let solucion = '';
          const parsed = typeof cached.resultado_json === 'string'
            ? (() => { try { return JSON.parse(cached.resultado_json); } catch { return null; } })()
            : cached.resultado_json;
          if (parsed && typeof parsed === 'object') {
            critico = parsed.critico || '';
            solucion = parsed.solucion || '';
          }
          if (critico && solucion) {
            hits.push({ id, tipoGrafico, chart: chartEnriched, context, critico, solucion });
            return;
          }
        }
      } catch (e) {
        console.warn('[ReporteExport] ⚠️ Error consultando caché:', e?.message || e);
      }

      misses.push({ id, tipoGrafico, chart: chartEnriched, context, filtrosHash });
    }));
    console.timeEnd('[Timing] 1-Consulta caché IA');

    // Call AI for misses
    console.time('[Timing] 2-Llamada a OpenAI');
    let results = [];
    if (misses.length && process.env.OPENAI_API_KEY) {
      const batchItems = misses.map(m => ({ id: m.id, chart: m.chart, context: m.context }));
      results = await generarResumenCriticoBatch(batchItems);
    }
    console.timeEnd('[Timing] 2-Llamada a OpenAI');

    // Persist misses and combine with hits
    const criticoMap = new Map(results.map(r => [String(r.id), { critico: r.critico || '', solucion: r.solucion || '' }]));

    for (const m of misses) {
      const aiResult = criticoMap.get(m.id) || { critico: '', solucion: '' };
      let critico = aiResult.critico;
      let solucion = aiResult.solucion;

      // Real fallback if AI fails
      if (!critico || !solucion) {
        const fallback = buildFallback(m);
        critico = fallback.critico;
        solucion = fallback.solucion;
      }

      hits.push({ id: m.id, tipoGrafico: m.tipoGrafico, chart: m.chart, context: m.context, critico, solucion });

      try {
        await insertAnalisis({
          tipoGrafico: m.tipoGrafico,
          filtrosHash: m.filtrosHash,
          contextJson: m.context,
          chartJson: m.chart,
          resultadoJson: { critico, solucion },
          analysisText: critico,
          model: process.env.OPENAI_MODEL || 'gpt-5-mini',
          promptVersion: promptVersion,
          createdBy: req.user?.id || 'system'
        });
      } catch (e) {
        console.warn('[ReporteExport] ⚠️ No se pudo persistir análisis:', e?.message || e);
      }
    }

    // Generate chart images
    console.time('[Timing] 3-Generacion de imagenes de graficos');
    const chartDataMap = new Map(hits.map(h => [h.id, h]));

    await Promise.all(charts.map(async (item) => {
      const id = String(item?.id || '');
      const tipoGrafico = String(item?.tipoGrafico || '').trim();
      const chart = item?.chart || {};
      const data = chartDataMap.get(id);

      if (!data) return;

      let imagePath = null;

      try {
        if (tipoGrafico === 'radar') {
          const labels = chart.x?.labels || [];
          const datos = chart.series?.[0]?.data || [];
          const umbralRadar = chart.extra?.umbral ?? 51;
          imagePath = await generarGraficoRadar(labels, datos, `export_radar_${id}.png`, 'Competencias del Alumno', umbralRadar);
        } else if (tipoGrafico === 'radar_fase') {
          const labels = chart.x?.labels || [];
          const datos = chart.series?.[0]?.data || [];
          imagePath = await generarGraficoRadar(labels, datos, `export_radar_fase_${id}.png`, 'Vista por Fase (Operativa)');
        } else if (tipoGrafico === 'burbujas') {
          const items = chart.extra?.items || [];
          const umbral = chart.extra?.umbral ?? 51;
          const bubbleItems = items.map(it => ({
            competencia: it.competencia || 'Competencia',
            x: Number(it.x) || 0,
            y: Number(it.y) || 0,
            r: Number(it.r) || 10,
            cumpleUmbral: it.cumpleUmbral
          }));
          imagePath = await generarGraficoBurbujas(bubbleItems, `export_burbujas_${id}.png`, 'Logro vs. Distancia al Umbral', umbral);
        } else if (tipoGrafico === 'barras') {
          const labels = chart.x?.labels || [];
          const series = chart.series || [];
          imagePath = await generarGraficoBarrasComparativa(labels, series, `export_barras_${id}.png`, 'Alumno vs Promedio');
        } else if (tipoGrafico === 'lineas' && meta.alumno) {
          const lineasData = chart.extra?.items || chart.data || [];
          imagePath = await generarGraficoTrayectoria(lineasData, `export_lineas_${id}.png`, 'Trayectoria Académica');
        } else if (tipoGrafico === 'evolucion') {
          const evolucionData = chart.extra?.items || [];
          imagePath = await generarGraficoEvolucion(evolucionData, `export_evolucion_${id}.png`, 'Evolución por Evaluación');
        }

        if (imagePath) {
          data.imageBase64 = imagePath; // ahora imagePath ya es el string base64 directo
        }
      } catch (e) {
        console.warn('[ReporteExport] ⚠️ Error generando imagen para', tipoGrafico, id, e?.message || e);
      }
    }));
    console.timeEnd('[Timing] 3-Generacion de imagenes de graficos');

    // Build HTML
    const logoPath = path.join(__dirname, '..', 'assets', 'fain.png');
    const logoBase64 = imageToBase64(logoPath);

    const metaParts = [
      meta.carrera ? `Carrera: ${meta.carrera}` : null,
      meta.plan ? `Plan: ${meta.plan}` : null,
      meta.cohorte ? `Cohorte: ${meta.cohorte}` : null,
      meta.semestre ? `Semestre: ${meta.semestre}` : null,
      meta.asignatura ? `Asignatura: ${meta.asignatura}` : null,
      meta.alumno ? `Alumno: ${meta.alumno}` : null
    ].filter(Boolean);

    const leyendaHtml = (meta.competencias && meta.competencias.length)
      ? `<p class="leyenda-competencias">${meta.competencias.map(c => `<strong>${c.codigo}:</strong> ${c.nombre}`).join(' &nbsp;|&nbsp; ')}</p>` 
      : '';

    // Grid charts (radar, radar_fase, burbujas, barras, lineas)
    const gridCharts = hits.filter(h => ['radar', 'radar_fase', 'burbujas', 'barras', 'lineas', 'evolucion', 'tramos'].includes(h.tipoGrafico));
    const gridPanelsHtml = gridCharts.map(chartData => {
      const titles = {
        radar: 'Competencias del Alumno',
        radar_fase: 'Vista por Fase (Operativa)',
        burbujas: 'Logro vs. Distancia al Umbral',
        barras: 'Alumno vs Promedio',
        lineas: 'Trayectoria Académica',
        evolucion: 'Evolución por Evaluación',
        tramos: 'Competencias del Perfil de Egreso'
      };
      const title = chartData.chart?.chartTitle || titles[chartData.tipoGrafico] || chartData.tipoGrafico;

      if (chartData.tipoGrafico === 'tramos') {
        const filas = chartData.chart?.extra?.filas || [];
        const modoCurso = chartData.chart?.extra?.modoCurso;
        const filasHtml = filas.map(f => `
          <tr>
            <td style="text-align:left; font-weight:bold;">${f.competencia}</td>
            <td>${Number(f.satisfactorio).toFixed(2)}</td>
            <td>${Number(f.suficiente).toFixed(2)}</td>
            <td>${Number(f.deficiente).toFixed(2)}</td>
          </tr>
        `).join('');
        const leyendaTexto = modoCurso
          ? 'Cada porcentaje representa la proporción de alumnos inscritos en ese tramo.'
          : 'Cada porcentaje representa la proporción de evaluaciones/notas del alumno en ese tramo.';

        return `
          <div class="chart-block">
            <div class="panel">
              <h3>${title}</h3>
              <div class="tramos-leyenda">
                <span><strong>Deficiente</strong> (0-50%)</span>
                <span><strong>Suficiente</strong> (51-74%)</span>
                <span><strong>Satisfactorio</strong> (75-100%)</span>
              </div>
              <p class="tramos-nota">${leyendaTexto}</p>
              <table class="tramos-table">
                <thead>
                  <tr>
                    <th style="text-align:left;">Competencia</th>
                    <th>Satisfactorio %</th>
                    <th>Suficiente %</th>
                    <th>Deficiente %</th>
                  </tr>
                </thead>
                <tbody>${filasHtml}</tbody>
              </table>
            </div>
            <div class="chart-text">
              <p class="critico">⚠ Crítico: ${chartData.critico}</p>
              <p class="solucion">✓ Recomendación: ${chartData.solucion}</p>
            </div>
          </div>
        `;
      }

      const imgBase64 = chartData.imageBase64 || null;
      
      return `
        <div class="chart-block">
          <div class="panel">
            <h3>${title}</h3>
            ${imgBase64 ? `<img src="${imgBase64}" alt="${title}" />` : '<p class="no-data">Sin datos disponibles para este gráfico</p>'}
            ${chartData.tipoGrafico === 'burbujas' ? '<p class="nota-indicadores">*ind = N° de indicadores</p>' : ''}
          </div>
          <div class="chart-text">
            <p class="critico">⚠ Crítico: ${chartData.critico}</p>
            <p class="solucion">✓ Recomendación: ${chartData.solucion}</p>
          </div>
        </div>
      `;
    }).join('');

    // Heatmap
    const heatmapChart = hits.find(h => h.tipoGrafico === 'heatmap');
    let heatmapHtml = '';
    if (heatmapChart) {
      const heatmapData = heatmapChart.chart?.extra?.items || {};
      const asignaturaNombre = heatmapData.asignatura || '';
      const competencias = heatmapData.competencias || [];
      const filas = heatmapData.filas || [];

      if (filas.length > 0 && competencias.length > 0) {
        const headerCells = '<th>Alumno / Asignatura</th>' + competencias.map(comp => `<th>${comp}</th>`).join('');
        const dataRows = filas.map(fila => {
          const esAsignatura = fila.tipo === 'asignatura';
          const labelCell = esAsignatura
            ? `<td style="font-weight:bold; background-color:#f0f4fa;">${fila.label}</td>` 
            : `<td>${fila.label}</td>`;
          const dataCells = competencias.map(comp => {
            const celda = fila.valores?.[comp];
            let bgColor = '#e0e0e0', textColor = '#666', value = 'N/A';
            if (celda) {
              if (celda.estado === 'con_datos') {
                bgColor = getHeatmapColorDegradado(celda.logro);
                textColor = getHeatmapTextColorDegradado(celda.logro);
                value = `${Math.round(celda.logro)}%`;
              } else if (celda.estado === 'sin_evaluar') {
                bgColor = '#f5f5f5'; textColor = '#666'; value = 'Pend.';
              }
            }
            return `<td style="background-color: ${bgColor}; color: ${textColor}; text-align: center;">${value}</td>`;
          }).join('');
          return `<tr>${labelCell}${dataCells}</tr>`;
        }).join('');

        heatmapHtml = `
          <div class="full-width-section">
            <h2>Mapa de Calor: ${asignaturaNombre}</h2>
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">Primera fila: promedio de la asignatura. Filas siguientes: desempeño individual de cada alumno inscrito.</p>
            <div class="heatmap-leyenda">
              <span style="display:flex; align-items:center; gap:4px;">
                <span style="width:120px; height:12px; border-radius:2px; background: linear-gradient(to right, rgb(211,47,47), rgb(255,193,7), rgb(76,175,80)); display:inline-block;"></span>
                0% &nbsp;→&nbsp; 100% (Nivel de logro)
              </span>
              <span><span class="leyenda-color" style="background:#f5f5f5; border:1px solid #ddd;"></span> Pendiente de evaluar</span>
              <span><span class="leyenda-color" style="background:#e0e0e0; border:1px solid #ccc;"></span> No aplica</span>
            </div>
            <table class="heatmap-table">
              <thead><tr>${headerCells}</tr></thead>
              <tbody>${dataRows}</tbody>
            </table>
          </div>
        `;
      } else {
        heatmapHtml = '';
      }
    } else {
      heatmapHtml = '';
    }


    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header-logo {
      max-height: 60px;
      display: block;
      margin: 0 auto 10px;
    }
    h1 {
      margin: 10px 0;
      font-size: 24px;
    }
    .meta {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    .leyenda-competencias {
      font-size: 10px;
      color: #888;
      text-align: center;
      margin: 4px 20px 0;
      line-height: 1.4;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 30px;
    }
    .chart-block {
      display: flex;
      flex-direction: column;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .panel {
      border: 1px solid #eee;
      padding: 2px 4px 0 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .panel h3 {
      margin: 2px 0 6px 0;
      font-size: 14px;
      text-align: center;
    }
    .panel img {
      width: 100%;
      height: auto;
      display: block;
    }
    .chart-text {
      padding: 8px 6px 0 6px;
    }
    .critico {
      margin: 5px 0;
      font-size: 13px;
      color: #d32f2f;
    }
    .solucion {
      margin: 5px 0;
      font-size: 13px;
      color: #388e3c;
    }
    .no-data {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 20px;
    }
    .full-width-section {
      margin-bottom: 30px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .full-width-section h2 {
      font-size: 18px;
      margin-bottom: 15px;
    }
    .heatmap-table {
      width: 100%;
      border-collapse: collapse;
    }
    .heatmap-table th, .heatmap-table td {
      border: 1px solid #ddd;
      padding: 5px 6px;
      text-align: center;
      font-size: 11px;
    }
    .heatmap-table th {
      background-color: #f5f5f5;
    }
    .nota-indicadores {
      font-size: 9px;
      color: #666;
      text-align: center;
      margin: 4px 0 0 0;
      font-style: italic;
    }
    .tramos-leyenda {
      display: flex;
      justify-content: center;
      gap: 14px;
      font-size: 10px;
      color: #333;
      margin: 4px 0 2px 0;
    }
    .tramos-nota {
      font-size: 9px;
      color: #666;
      text-align: center;
      margin: 0 0 8px 0;
      font-style: italic;
    }
    .tramos-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .tramos-table th, .tramos-table td {
      border: 1px solid #ddd;
      padding: 3px 5px;
      text-align: center;
    }
    .tramos-table th {
      background-color: #f5f5f5;
    }
    .heatmap-leyenda {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 10px;
      color: #555;
      margin-bottom: 10px;
    }
    .leyenda-color {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 2px;
      margin-right: 3px;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="header-logo" />` : ''}
    <h1>Informe de Análisis de Competencias</h1>
    <p class="meta">${metaParts.join(' | ')}</p>
    ${leyendaHtml}
  </div>
  <div class="grid">
    ${gridPanelsHtml}
  </div>
  ${heatmapHtml}
</body>
</html>
    `;

    // Generate PDF with Puppeteer (abre y cierra el browser en cada request para liberar RAM)
    console.time('[Timing] 4-Puppeteer PDF');
    let browser;
    try {
      browser = await puppeteer.launch({
        channel: 'chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-extensions'
        ]
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
      });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Analitica.pdf');
      console.timeEnd('[Timing] 4-Puppeteer PDF');
      return res.send(pdfBuffer);
    } catch (puppeteerError) {
      console.error('[ReporteExport] ❌ Error con Puppeteer:', puppeteerError?.message || puppeteerError);
      if (browser) { try { await browser.close(); } catch {} }

      if (puppeteerError?.message?.includes('Chrome') || puppeteerError?.message?.includes('executable') || puppeteerError?.message?.includes('not found')) {
        return res.status(500).json({
          message: 'No se encontró Google Chrome instalado en el sistema. Instálalo desde https://www.google.com/chrome/ e intenta nuevamente.'
        });
      }

      return res.status(500).json({ message: 'Error al generar el PDF del reporte' });
    }

  } catch (err) {
    console.error('[ReporteExport] ❌ Error generarReporteAnalitica:', err?.message || err);
    return res.status(500).json({ message: 'Error al generar reporte de analítica' });
  }
};
