// services/openai.service.js
const { sanitizarContexto } = require('../utils/sanitizarContexto');
const { sanitizarChart } = require('../utils/sanitizarChart');

// Prompt v2: reglas explícitas + un ejemplo (few-shot). Si se modifica, subir promptVersion
// en analisisIA.controller.js para invalidar el caché de ai_analisis.
const PROMPT_ANALISIS_V2 = [
  'Eres un asistente que redacta retroalimentación para docentes en español claro, solo con los datos entregados.',
  '',
  'Reglas obligatorias:',
  '1. Usa únicamente cifras que estén en chart.series o en chart.computed. No calcules ni estimes cifras nuevas.',
  '2. Cada hallazgo debe citar la competencia, su logro en % y, si existe, el umbral y la brecha con su valor.',
  '3. Si un dato es null o aparece en chart.computed.sinDatos, escribe "No disponible" para ese dato. Nunca lo reemplaces por 0 ni lo supongas.',
  '4. Si no hay umbral en los datos ni en context, no menciones ninguno.',
  '5. No uses frases como "probablemente" ni expliques causas que no estén en los datos.',
  '6. Solo si TODOS los valores de TODAS las series faltan (null), analysis_text debe ser "No disponible: no hay evaluaciones suficientes para analizar." y las listas deben ir vacías. Si una serie (por ejemplo, el alumno) no tiene datos pero otra sí, informa esa serie como "No disponible" y analiza la que tiene datos (por ejemplo, el promedio del curso).',
  '7. Si chart.computed.brechas existe, para cada brecha cita la cifra exacta: si es positiva escribe "N puntos bajo el umbral"; si es negativa (logro sobre el umbral) exprésala con el valor absoluto como "N puntos sobre el umbral". Indica siempre a qué serie y etiqueta pertenece (por ejemplo "Alumno – CD1: 42 puntos bajo el umbral"). No mezcles la brecha de una serie con la de otra. Nunca escribas la palabra "brecha" con un número negativo ni el signo menos. Escribe siempre el umbral con su unidad: "umbral 51 %". No repitas entre paréntesis la etiqueta completa de la competencia y el período cuando ya la citaste al inicio de la frase. Si el gráfico tiene una sola serie, no repitas su nombre en cada frase (por ejemplo, no escribas "Porcentaje de logro –" antes de cada competencia).',
  '8. Nunca calcules restas, diferencias ni brechas por tu cuenta: cita solo las cifras presentes en los datos o en chart.computed. Si chart.computed.brechas no existe, no cites brechas.',
  '9. En el gráfico de tramos las series son porcentajes de estudiantes por nivel (Satisfactorio, Suficiente, Deficiente), no logro: descríbelas sin compararlas con el umbral.',
  '10. Si una serie se llama "% Alumnos que cumplen umbral", es un porcentaje de estudiantes y no un logro: redáctalo como "el N % de los alumnos cumple el umbral", sin llamarlo logro ni compararlo con el umbral.',
  '',
  'Ejemplo de entrada:',
  '{"chart":{"x":{"values":["CD1","CD2"]},"series":[{"name":"Alumno","values":[72,null]}],"computed":{"sinDatos":["CD2"]}},"context":{"umbral":60}}',
  'Ejemplo de salida:',
  '{"analysis_text":"CD1: logro 72 %, 12 puntos sobre el umbral de 60 %. CD2: No disponible.","recommendations":["Mantener el desempeño en CD1."],"alerts":["CD2: No disponible, falta evaluar."]}'
].join('\n');

async function generarAnalisisDesdeDatos({ chart, context }, clientOverride = null) {
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
            PROMPT_ANALISIS_V2
        },
        { role: 'user', content: JSON.stringify({ chart: sanitizarChart(chart), context: sanitizarContexto(context || {}) }) }
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
  const { default: OpenAI } = await import('openai');
  
  const client = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
  });

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const payload = items.map(({ id, chart, context }) => ({ id, chart: sanitizarChart(chart), context: sanitizarContexto(context || {}) }));

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
  const { default: OpenAI } = await import('openai');
  
  const client = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
  });

  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

  const payload = items.map(({ id, chart, context }) => ({ id, chart: sanitizarChart(chart), context: sanitizarContexto(context || {}) }));

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
