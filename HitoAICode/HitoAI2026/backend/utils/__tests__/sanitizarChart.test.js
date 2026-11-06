// ===============================
// PU-15: sanitizarChart anonimiza nombres/RUT de alumnos en heatmap
// ===============================
const assert = require('assert');
const { sanitizarChart } = require('../sanitizarChart');

console.log('Ejecutando PU-15: anonimización de heatmap...\n');

// Caso 1 — forma /analisis/ia: x.values + extra.resumen con nombres y RUT
const chart = {
  chartTitle: 'Mapa de Calor',
  x: { label: 'Alumno/Asignatura', values: ['TIS800', 'Pérez Ana', 'Soto Luis'] },
  series: [{ name: 'Logro Promedio (%)', unit: '%', values: [72, 80, 65] }],
  extra: {
    totalAlumnos: 2,
    totalCompetencias: 8,
    resumen: [
      { label: 'TIS800', tipo: 'asignatura', logroPromedio: 72 },
      { label: 'Pérez Ana', tipo: 'alumno', logroPromedio: 80, rut: '11.111.111-1', idEstudiante: 5 },
      { label: 'Soto Luis', tipo: 'alumno', logroPromedio: 65, nombre: 'Luis', apellido: 'Soto' }
    ]
  }
};
const s = sanitizarChart(chart, 'heatmap');
const json = JSON.stringify(s);
for (const fuga of ['Pérez', 'Ana', 'Soto', 'Luis', '11.111.111-1', 'idEstudiante']) {
  assert.ok(!json.includes(fuga), `No debe quedar "${fuga}" en el chart sanitizado`);
}
assert.deepStrictEqual(s.x.values, ['TIS800', 'Estudiante 1', 'Estudiante 2']);
assert.strictEqual(s.extra.resumen[0].label, 'TIS800');
assert.strictEqual(s.extra.resumen[0].tipo, 'asignatura');
assert.strictEqual(s.extra.resumen[1].label, 'Estudiante 1');
assert.strictEqual(s.extra.resumen[2].label, 'Estudiante 2');
assert.ok(!('rut' in s.extra.resumen[1]), 'rut debe eliminarse de la fila alumno');
assert.ok(!('idEstudiante' in s.extra.resumen[1]), 'idEstudiante debe eliminarse');
assert.ok(!('nombre' in s.extra.resumen[2]) && !('apellido' in s.extra.resumen[2]));
assert.strictEqual(s.extra.resumen[1].logroPromedio, 80, 'los datos de logro se conservan');
// el original no se muta
assert.strictEqual(chart.extra.resumen[1].label, 'Pérez Ana');
console.log('✅ Caso 1 aprobado: x.values y resumen anonimizados, asignatura intacta, sin mutar original\n');

// Caso 2 — forma /reporte/exportar: extra.items.filas
const chartExport = {
  chartTitle: 'Mapa de Calor: TIS800',
  extra: {
    items: {
      asignatura: 'TIS800',
      competencias: ['CD1'],
      filas: [
        { label: 'TIS800', tipo: 'asignatura', valores: { CD1: { estado: 'con_datos', logro: 70 } } },
        { label: 'Pérez Ana', tipo: 'alumno', rut: '11.111.111-1', valores: { CD1: { estado: 'con_datos', logro: 80 } } },
        { label: 'Soto Luis', tipo: 'alumno', valores: { CD1: { estado: 'sin_evaluar', logro: null } } }
      ]
    }
  }
};
const se = sanitizarChart(chartExport, 'heatmap');
const jsonExport = JSON.stringify(se);
assert.ok(!jsonExport.includes('Pérez') && !jsonExport.includes('Soto') && !jsonExport.includes('11.111.111-1'));
assert.deepStrictEqual(se.extra.items.filas.map(f => f.label), ['TIS800', 'Estudiante 1', 'Estudiante 2']);
assert.strictEqual(se.extra.items.asignatura, 'TIS800');
assert.deepStrictEqual(se.extra.items.filas[1].valores, { CD1: { estado: 'con_datos', logro: 80 } });
console.log('✅ Caso 2 aprobado: extra.items.filas anonimizado en forma export\n');

// Caso 3 — detección por forma (sin tipoGrafico) y charts no-heatmap intactos
const sinTipo = sanitizarChart(chartExport);
assert.strictEqual(sinTipo.extra.items.filas[1].label, 'Estudiante 1');
const otro = { x: { values: ['CD1'] }, series: [{ name: 'A', values: [50] }], extra: { umbral: 60 } };
assert.deepStrictEqual(sanitizarChart(otro, 'radar'), otro);
assert.strictEqual(sanitizarChart(null, 'heatmap'), null);
console.log('✅ Caso 3 aprobado: detección por forma y no-heatmap devuelto igual\n');

console.log('PU-15 APROBADA: los nombres y RUT de alumnos no llegan a OpenAI ni a ai_analisis en heatmap.');
