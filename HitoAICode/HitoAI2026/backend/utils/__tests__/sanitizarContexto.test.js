// ===============================
// PU-12: sanitizarContexto elimina datos personales del alumno
// ===============================
const assert = require('assert');
const { sanitizarContexto } = require('../sanitizarContexto');

console.log('Ejecutando PU-12: sanitización de contexto (nombre y RUT)...\n');

// Caso 1 — contexto individual: elimina claves sensibles y agrega modo 'individual'
const ctxIndividual = {
  carreraId: 1,
  carreraNombre: 'Ingeniería Civil Industrial',
  asignatura: 'TIS800',
  asignaturaNombre: 'Taller de Innovación',
  cohorte: '2024',
  alumno: '20268128K',
  alumnoNombre: 'Ana Pérez González',
  nombre: 'Ana',
  apellido: 'Pérez',
  rut: '12.345.678-9',
  idEstudiante: 55,
  semestre: 8,
  umbral: 60
};
const s1 = sanitizarContexto(ctxIndividual);
assert.strictEqual(s1.modo, 'individual');
for (const k of ['alumno', 'alumnoNombre', 'nombre', 'apellido', 'rut', 'idEstudiante']) {
  assert.ok(!(k in s1), `No debe existir la clave: ${k}`);
}
assert.strictEqual(s1.asignatura, 'TIS800');
assert.strictEqual(s1.carreraNombre, 'Ingeniería Civil Industrial');
assert.strictEqual(s1.umbral, 60);
const serializado = JSON.stringify(s1);
assert.ok(!serializado.includes('20268128K'), 'No debe quedar el RUT/ID del alumno');
assert.ok(!serializado.includes('Ana'), 'No debe quedar el nombre del alumno');
console.log('✅ Caso 1 aprobado: claves sensibles eliminadas, modo individual, datos académicos conservados\n');

// Caso 2 — contexto de curso: modo 'curso'
const s2 = sanitizarContexto({ asignatura: 'TIS800', anio: 2025, semestre: 8, umbral: 60 });
assert.strictEqual(s2.modo, 'curso');
assert.strictEqual(s2.asignatura, 'TIS800');
console.log('✅ Caso 2 aprobado: sin alumno => modo curso\n');

// Caso 3 — claves exactas de la lista sensible, incluso anidadas
const s3 = sanitizarContexto({
  asignatura: 'TIS800',
  filtros: { rutAlumno: '20.111.222-3', nombreCompleto: 'Luis Soto', carreraNombre: 'Derecho' },
  detalle: [{ idEstudiante: 7, etiqueta: 'parcial' }]
});
assert.ok(!('rutAlumno' in s3.filtros), 'rutAlumno debe eliminarse (clave exacta en la lista)');
assert.ok(!('nombreCompleto' in s3.filtros), 'nombreCompleto debe eliminarse (clave exacta en la lista)');
assert.strictEqual(s3.filtros.carreraNombre, 'Derecho');
assert.ok(!('idEstudiante' in s3.detalle[0]), 'idEstudiante anidado debe eliminarse');
assert.strictEqual(s3.detalle[0].etiqueta, 'parcial');
console.log('✅ Caso 3 aprobado: claves con "alumno"/"rut" eliminadas de forma recursiva\n');

// Caso 4 — no muta el objeto original e idempotencia del modo
assert.strictEqual(ctxIndividual.alumno, '20268128K');
assert.strictEqual(ctxIndividual.rut, '12.345.678-9');
const s4 = sanitizarContexto(s1);
assert.strictEqual(s4.modo, 'individual', 'Re-sanitizar no debe degradar modo individual a curso');
console.log('✅ Caso 4 aprobado: no muta el original y modo individual es estable\n');

// Caso 5 — claves legítimas que CONTIENEN alumno/rut se conservan;
// variantes en mayúsculas de la lista sí se eliminan
const s5 = sanitizarContexto({
  ruta: '/tmp/x', nAlumnos: 30, totalAlumnos: 30,
  Alumno: '20268128K', RUT: '12.345.678-9'
});
assert.strictEqual(s5.ruta, '/tmp/x');
assert.strictEqual(s5.nAlumnos, 30);
assert.strictEqual(s5.totalAlumnos, 30);
assert.ok(!('Alumno' in s5), 'Alumno (mayúscula) debe eliminarse');
assert.ok(!('RUT' in s5), 'RUT (mayúscula) debe eliminarse');
console.log('✅ Caso 5 aprobado: claves legítimas conservadas, variantes en mayúsculas eliminadas\n');

console.log('PU-12 APROBADA: sanitizarContexto elimina nombre, RUT e identificadores del alumno.');
