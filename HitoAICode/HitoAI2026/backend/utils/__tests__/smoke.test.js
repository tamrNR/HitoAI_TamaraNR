// Prueba de humo: carga app.js completa (sin escuchar puerto) y verifica
// que las rutas exijan JWT real (un header X-User-Role suelto NO autoriza)
const assert = require('assert');
const path = require('path');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-smoke';

// Stub de la capa de datos ANTES de cargar la app (sin MySQL real)
const stubQuery = (sql, params, cb) => {
  if (typeof params === 'function') { cb = params; params = []; }
  setImmediate(() => cb(null, []));
};
const connectionPath = require.resolve('../../db/connection');
require.cache[connectionPath] = {
  id: connectionPath, filename: connectionPath, loaded: true,
  exports: { query: stubQuery, promise: () => ({ query: async () => [[]] }), connect: (cb) => cb && cb() }
};
const poolPath = require.resolve('../../db/pool');
require.cache[poolPath] = {
  id: poolPath, filename: poolPath, loaded: true,
  exports: { query: async () => [[]] }
};

const request = require('supertest');
const app = require('../../app');

let passed = 0;
async function check(nombre, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${nombre}`); }
  catch (e) { console.error(`  ❌ ${nombre}:`, e.message); process.exitCode = 1; }
}

(async () => {
  console.log('\n== smoke: carga de app.js ==');

  await check('GET / responde 200', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
  });

  await check('GET /api/usuario/todos sin token -> 401', async () => {
    const res = await request(app).get('/api/usuario/todos');
    assert.strictEqual(res.status, 401);
  });

  await check('GET /api/usuario/todos con X-User-Role (sin JWT) -> 401', async () => {
    const res = await request(app)
      .get('/api/usuario/todos')
      .set('X-User-Role', 'Administrador');
    assert.strictEqual(res.status, 401);
  });

  await check('GET /api/graficos/radar sin token -> 401', async () => {
    const res = await request(app).get('/api/graficos/radar?asignatura=X&anio=2025&semestre=1');
    assert.strictEqual(res.status, 401);
  });

  await check('POST /api/reporte/exportar sin token -> 401', async () => {
    const res = await request(app).post('/api/reporte/exportar').send({ charts: [] });
    assert.strictEqual(res.status, 401);
  });

  console.log(`\n== smoke.test.js: ${passed} checks OK ==\n`);
})();
