// controllers/analisisIA.controller.js
const { generarAnalisisDesdeDatos } = require('../services/openai.service');
const { computeMetrics } = require('../services/metrics.service');
const { buildFiltrosHash } = require('../utils/hash.util');
const { findByHash, findById, insertAnalisis, updateError } = require('../services/aiAnalisis.repository');

async function generarAnalisisIA(req, res) {
  try {
    const { chart, context } = req.body || {};

    if (
      !chart ||
      typeof chart !== 'object' ||
      !chart.x ||
      !chart.series ||
      !Array.isArray(chart.series) ||
      chart.series.length === 0
    ) {
      return res.status(400).json({
        analysis_text: 'Payload inválido. Se requiere "chart" con "x" y "series" (al menos 1).',
        recommendations: [],
        alerts: []
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error IA: 500 Falta configuración OPENAI_API_KEY');
      return res.status(500).json({
        analysis_text: 'Ocurrió un error al generar el análisis con IA.',
        recommendations: [],
        alerts: []
      });
    }

    // Inferir tipo de gráfico si no viene explícito
    let tipoGrafico = String(req.body?.tipoGrafico || '').trim();
    if (!tipoGrafico) {
      if (chart?.summary || chart?.extra) tipoGrafico = 'burbujas';
      else if (Array.isArray(chart?.series) && chart.series.length >= 2) tipoGrafico = 'barras';
      else tipoGrafico = 'barras';
    }

    const promptVersion = 'v1';

    // Enriquecer con métricas
    const metrics = computeMetrics({ chart, tipoGrafico });
    const chartEnriched = { ...chart, computed: metrics };

    // Hash estable de filtros
    const filtrosHash = buildFiltrosHash({
      tipoGrafico,
      context,
      chart: chartEnriched,
      promptVersion
    });
    console.log('[AnalisisIA] hash:', filtrosHash);

    // Intentar caché
    let cacheHit = false;
    try {
      const cached = await findByHash(tipoGrafico, filtrosHash);
      if (cached && cached.status === 'ok' && cached.resultado_json != null) {
        const parsed = (typeof cached.resultado_json === 'string')
          ? (() => { try { return JSON.parse(cached.resultado_json); } catch { return null; } })()
          : cached.resultado_json;
        if (parsed) {
          // Invalidar caché si contiene error
          const isError = String(parsed.analysis_text || cached.analysis_text || '').includes('Ocurrió un error al generar el análisis con IA.');
          if (isError) {
            console.log('[AnalisisIA] ⚠️ cache hit pero contiene error - ignorando caché');
            cacheHit = false;
          } else {
            console.log('[AnalisisIA] ✅ cache hit');
            cacheHit = true;
            return res.json({
              analysis_id: cached.id,
              analysis_text: String(parsed.analysis_text || cached.analysis_text || ''),
              recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
              alerts: Array.isArray(parsed.alerts) ? parsed.alerts : []
            });
          }
        }
      }
    } catch (e) {
      console.warn('[AnalisisIA] ⚠️ Error consultando caché:', e?.message || e);
    }

    // No hay caché => llamar OpenAI
    if (!cacheHit) {
      console.log('[AnalisisIA] ⛔ cache miss - llamando OpenAI');
    }
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
    const result = await generarAnalisisDesdeDatos({ chart: chartEnriched, context });

    const normalized = {
      analysis_text: String(result?.analysis_text || ''),
      recommendations: Array.isArray(result?.recommendations) ? result.recommendations : [],
      alerts: Array.isArray(result?.alerts) ? result.alerts : []
    };

    // Guardar resultado
    let insertedId = null;
    try {
      const ins = await insertAnalisis({
        tipoGrafico,
        filtrosHash,
        contextJson: context,
        chartJson: chartEnriched,
        resultadoJson: normalized,
        analysisText: normalized.analysis_text,
        model,
        promptVersion,
        createdBy: req.user?.id || 'system'
      });
      insertedId = ins?.id || null;
    } catch (e) {
      console.warn('[AnalisisIA] ⚠️ No se pudo insertar en ai_analisis:', e?.message || e);
    }

    return res.json({
      analysis_id: insertedId,
      ...normalized
    });
  } catch (err) {
    console.error('❌ Error IA:', err?.status, err?.message);
    console.error(err?.error || err);

    // Persistir error
    try {
      const body = req.body || {};
      const chart = body.chart || {};
      const context = body.context || {};
      let tipoGrafico = String(body?.tipoGrafico || '').trim();
      if (!tipoGrafico) {
        if (chart?.summary || chart?.extra) tipoGrafico = 'burbujas';
        else if (Array.isArray(chart?.series) && chart.series.length >= 2) tipoGrafico = 'barras';
        else tipoGrafico = 'barras';
      }
      const promptVersion = 'v1';
      const metrics = computeMetrics({ chart, tipoGrafico });
      const chartEnriched = { ...chart, computed: metrics };
      const filtrosHash = buildFiltrosHash({ tipoGrafico, context, chart: chartEnriched, promptVersion });
      await updateError({
        tipoGrafico,
        filtrosHash,
        model: process.env.OPENAI_MODEL || 'gpt-5-mini',
        promptVersion,
        errorMessage: err?.message || String(err),
        contextJson: context,
        chartJson: chartEnriched,
        createdBy: req.user?.id || 'system'
      });
    } catch (e) {
      console.warn('[AnalisisIA] ⚠️ No se pudo registrar error en ai_analisis:', e?.message || e);
    }

    return res.status(500).json({
      analysis_text: 'Ocurrió un error al generar el análisis con IA.',
      recommendations: [],
      alerts: []
    });
  }
}

async function obtenerAnalisisPorId(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }
    const row = await findById(id);
    if (!row) return res.status(404).json({ error: 'No encontrado' });

    const parseMaybe = (v) => {
      if (v == null) return null;
      if (typeof v === 'object') return v;
      try { return JSON.parse(v); } catch { return v; }
    };

    const payload = {
      id: row.id,
      tipo_grafico: row.tipo_grafico,
      filtros_hash: row.filtros_hash,
      status: row.status,
      context_json: parseMaybe(row.context_json),
      chart_json: parseMaybe(row.chart_json),
      resultado_json: parseMaybe(row.resultado_json),
      analysis_text: row.analysis_text || '',
      model: row.model,
      prompt_version: row.prompt_version,
      error_message: row.error_message || null,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    return res.json(payload);
  } catch (e) {
    console.error('❌ Error obtenerAnalisisPorId:', e?.message || e);
    return res.status(500).json({ error: 'Error al obtener análisis' });
  }
}

module.exports = {
  generarAnalisisIA,
  obtenerAnalisisPorId
};
