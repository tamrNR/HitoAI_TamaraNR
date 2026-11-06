// utils/sanitizarChart.js
// Anonimiza nombres/RUT de alumnos en gráficos heatmap antes de OpenAI o ai_analisis.
// Solo afecta filas con tipo === 'alumno'; la fila 'asignatura' queda intacta.
// Detecta heatmap por tipoGrafico o por forma (extra.resumen[] / extra.items.filas[]).
//
// Claves reales observadas:
//   extra.resumen[]      -> { label, tipo, logroPromedio }   (/analisis/ia)
//   extra.items.filas[]  -> { label, tipo, valores }        (/reporte/exportar)

const CLAVES_IDENTIFICADORAS = new Set(['rut', 'id', 'idestudiante', 'nombre', 'apellido']);

function esAlumno(tipo) {
  return String(tipo).toLowerCase() === 'alumno';
}

function anonimizarFila(fila, nuevoLabel) {
  const out = {};
  for (const [k, v] of Object.entries(fila || {})) {
    if (CLAVES_IDENTIFICADORAS.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  out.label = nuevoLabel;
  return out;
}

function sanitizarChart(chart, tipoGrafico) {
  if (!chart || typeof chart !== 'object') return chart;
  const extra = chart.extra && typeof chart.extra === 'object' ? chart.extra : {};
  const resumen = Array.isArray(extra.resumen) ? extra.resumen : null;
  const items = extra.items && typeof extra.items === 'object' ? extra.items : null;
  const filasItems = Array.isArray(items?.filas) ? items.filas : null;
  if (tipoGrafico !== 'heatmap' && !resumen && !filasItems) return chart;

  const out = { ...chart, extra: { ...extra } };

  if (resumen) {
    let n = 0;
    out.extra.resumen = resumen.map(r =>
      esAlumno(r?.tipo) ? anonimizarFila(r, `Estudiante ${++n}`) : r);
    if (Array.isArray(out.x?.values)) {
      out.x = {
        ...out.x,
        values: out.x.values.map((v, i) =>
          esAlumno(out.extra.resumen[i]?.tipo) ? out.extra.resumen[i].label : v)
      };
    }
  }

  if (filasItems) {
    let n = 0;
    out.extra.items = {
      ...items,
      filas: filasItems.map(f =>
        esAlumno(f?.tipo) ? anonimizarFila(f, `Estudiante ${++n}`) : f)
    };
  }

  return out;
}

module.exports = { sanitizarChart };
