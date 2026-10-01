const connection = require('../db/connection');
const pool = connection.promise();

async function findByHash(tipoGrafico, filtrosHash) {
  const sql = `
    SELECT id, tipo_grafico, filtros_hash, status,
           context_json, chart_json, resultado_json, analysis_text,
           model, prompt_version, created_at
    FROM ai_analisis
    WHERE tipo_grafico = ? AND filtros_hash = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [tipoGrafico, filtrosHash]);
  return rows[0] || null;
}

async function findById(id) {
  const sql = `
    SELECT id, tipo_grafico, filtros_hash, status,
           context_json, chart_json, resultado_json, analysis_text,
           model, prompt_version, error_message, created_by, created_at, updated_at
    FROM ai_analisis
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

async function insertAnalisis({ tipoGrafico, filtrosHash, contextJson, chartJson, resultadoJson, analysisText, model, promptVersion, createdBy }) {
  const sql = `
    INSERT INTO ai_analisis (
      tipo_grafico, filtros_hash, context_json, chart_json, resultado_json, analysis_text,
      model, prompt_version, status, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ok', ?, NOW(), NOW())
  `;

  const params = [
    tipoGrafico,
    filtrosHash,
    JSON.stringify(contextJson || {}),
    JSON.stringify(chartJson || {}),
    JSON.stringify(resultadoJson || {}),
    String(analysisText || ''),
    String(model || ''),
    String(promptVersion || ''),
    String(createdBy || 'system')
  ];

  try {
    const [result] = await pool.query(sql, params);
    return { id: result.insertId };
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      // Tolerar doble click: devolver caché existente
      const existing = await findByHash(tipoGrafico, filtrosHash);
      return existing ? { id: existing.id, duplicate: true } : { id: null, duplicate: true };
    }
    throw err;
  }
}

async function updateError({ tipoGrafico, filtrosHash, model, promptVersion, errorMessage, contextJson, chartJson, createdBy }) {
  const sql = `
    INSERT INTO ai_analisis (
      tipo_grafico, filtros_hash, context_json, chart_json, resultado_json, analysis_text,
      model, prompt_version, status, error_message, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, '{}', '', ?, ?, 'error', ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE 
      status = VALUES(status),
      error_message = VALUES(error_message),
      context_json = VALUES(context_json),
      chart_json = VALUES(chart_json),
      model = VALUES(model),
      prompt_version = VALUES(prompt_version),
      updated_at = NOW()
  `;

  const params = [
    tipoGrafico,
    filtrosHash,
    JSON.stringify(contextJson || {}),
    JSON.stringify(chartJson || {}),
    String(model || ''),
    String(promptVersion || ''),
    String(errorMessage || ''),
    String(createdBy || 'system')
  ];

  const [result] = await pool.query(sql, params);
  return { affectedRows: result.affectedRows };
}

module.exports = { findByHash, findById, insertAnalisis, updateError };
