// services/openai.service.js
async function generarAnalisisDesdeDatos({ chart, context }, clientOverride = null) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const { default: OpenAI } = await import('openai');

  const client = clientOverride || new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  try {
    const resp = await client.responses.create({
      model,
      input: [
        {
          role: 'system',
          content:
            'Eres un asistente que genera retroalimentación para docentes en español claro. Usa SOLO los datos entregados. Considera que el objeto chart incluye métricas precomputadas en chart.computed (promedios, min/max, brechas y comparaciones) para guiar tu análisis. Enfócate en hallazgos accionables.'
        },
        { role: 'user', content: JSON.stringify({ chart, context }) }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'teacher_chart_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              analysis_text: { type: 'string' },
              recommendations: { type: 'array', items: { type: 'string' } },
              alerts: { type: 'array', items: { type: 'string' } }
            },
            required: ['analysis_text', 'recommendations', 'alerts']
          }
        }
      }
    });

    const raw = resp?.output_text || '';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        analysis_text: raw || 'No se pudo generar un análisis válido.',
        recommendations: [],
        alerts: []
      };
    }

    return {
      analysis_text: parsed?.analysis_text ?? '',
      recommendations: Array.isArray(parsed?.recommendations) ? parsed.recommendations : [],
      alerts: Array.isArray(parsed?.alerts) ? parsed.alerts : []
    };
  } catch (error) {
    console.error('[OpenAI Service] Error:', error?.status, error?.message);
    console.error(error?.error || error);
    return {
      analysis_text: 'Ocurrió un error al generar el análisis con IA.',
      recommendations: [],
      alerts: []
    };
  }
}

async function generarInsightsBatch(items) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const { default: OpenAI } = await import('openai');
  
  const client = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
  });

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const payload = items.map(({ id, chart, context }) => ({ id, chart, context }));

  try {
    const resp = await client.responses.create({
      model,
      input: [
        {
          role: 'system',
          content:
            'Eres un asistente que entrega un insight breve y accionable por gráfico (máx 1 frase) en español. Usa SOLO los datos entregados. Los objetos chart incluyen métricas en chart.computed. Enfócate en el peor indicador (mínimo o mayor brecha).'
        },
        { role: 'user', content: JSON.stringify({ items: payload }) }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'insights_batch',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string' },
                    insight: { type: 'string' }
                  },
                  required: ['id', 'insight']
                }
              }
            },
            required: ['items']
          }
        }
      }
    });

    const raw = resp?.output_text || '{}';
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.items) ? parsed.items : [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('[OpenAI Service] Error (insights batch):', error?.status, error?.message);
    console.error(error?.error || error);
    return [];
  }
}

async function generarResumenCriticoBatch(items) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const { default: OpenAI } = await import('openai');
  
  const client = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
  });

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const payload = items.map(({ id, chart, context }) => ({ id, chart, context }));

  try {
    const resp = await client.responses.create({
      model,
      input: [
        {
          role: 'system',
          content:
            'Eres un asistente que entrega, por cada gráfico, dos campos breves en español: "critico" (la métrica o competencia más débil encontrada, máx 1 frase) y "solucion" (una acción concreta y breve para mejorarla, máx 1 frase). Usa SOLO los datos entregados. Los objetos chart incluyen métricas en chart.computed.'
        },
        { role: 'user', content: JSON.stringify({ items: payload }) }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'resumen_critico_batch',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    id: { type: 'string' },
                    critico: { type: 'string' },
                    solucion: { type: 'string' }
                  },
                  required: ['id', 'critico', 'solucion']
                }
              }
            },
            required: ['items']
          }
        }
      }
    });

    const raw = resp?.output_text || '{}';
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.items) ? parsed.items : [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('[OpenAI Service] Error (resumen crítico batch):', error?.status, error?.message);
    console.error(error?.error || error);
    return [];
  }
}

module.exports = { generarAnalisisDesdeDatos, generarInsightsBatch, generarResumenCriticoBatch };
