// Ejecuta todos los tests unitarios del backend (*.test.js en __tests__)
// Uso: node utils/__tests__/run-all.js
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// Tests omitidos: el módulo bajo prueba ya no existe en el código.
// (lista vacía por ahora; resumenCompetencias.test.js fue eliminado junto a su módulo)
const OMITIDOS = new Set();

function recolectarTests(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name !== 'node_modules') {
        if (entry.name !== 'node_modules') recolectarTests(full, acc);
      }
    } else if (entry.name.endsWith('.test.js')) {
      acc.push(full);
    }
  }
  return acc;
}

const dirs = ['routes', 'services', 'utils', 'middleware', 'controllers'].map(d => path.join(ROOT, d));
const tests = [];
for (const d of dirs) {
  if (fs.existsSync(d)) recolectarTests(d, tests);
}

const aEjecutar = tests.filter(t => !OMITIDOS.has(path.relative(ROOT, t)));
const omitidos = tests.filter(t => OMITIDOS.has(path.relative(ROOT, t)));

console.log(`\n=== Backend tests: ${aEjecutar.length} archivos ===`);
if (omitidos.length) {
  for (const t of omitidos) {
    console.log(`⏭️  Omitido (módulo inexistente): ${path.relative(ROOT, t)}`);
  }
}

let fallidos = 0;
for (const test of aEjecutar) {
  const rel = path.relative(ROOT, test);
  const res = spawnSync(process.execPath, [test], { encoding: 'utf8', cwd: ROOT });
  const ok = res.status === 0;
  if (!ok) fallidos++;
  console.log(`${ok ? '✅' : '❌'} ${rel}`);
  if (!ok) {
    const salida = `${res.stdout || ''}${res.stderr || ''}`.trim();
    console.log(salida.split('\n').slice(0, 15).join('\n'));
  }
}

console.log(`\n=== Resultado: ${aEjecutar.length - fallidos}/${aEjecutar.length} tests OK ===\n`);
process.exit(fallidos ? 1 : 0);
