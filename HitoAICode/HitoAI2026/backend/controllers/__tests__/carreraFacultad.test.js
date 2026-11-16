// Regla: crear/actualizar carrera exige facultad_ID_Facultad válida y existente
// Stub de db/connection: SELECT 1 FROM facultad -> existe o no; INSERT/UPDATE carrera -> ok
const assert = require('assert');

const connectionPath = require.resolve('../../db/connection');
const FACULTADES = new Set([1, 2]);

require.cache[connectionPath] = {
  id: connectionPath, filename: connectionPath, loaded: true,
  exports: {
    query: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      let rows = [];
      if (/FROM facultad WHERE ID_Facultad/i.test(sql)) {
        rows = FACULTADES.has(Number(params[0])) ? [{ '?column?': 1 }] : [];
      } else if (/INSERT INTO carrera|UPDATE carrera/i.test(sql)) {
        rows = { affectedRows: 1 };
      }
      setImmediate(() => cb(null, Array.isArray(rows) ? rows : [rows]));
    }
  }
};

const controller = require('../../controllers/carrera.controller');

function mockRes() {
  return {
    statusCode: null, body: null,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; if (this.statusCode === null) this.statusCode = 200; return this; }
  };
}

let passed = 0;
async function check(nombre, fn) {
  try { await fn(); passed++; console.log(`  ✅ ${nombre}`); }
  catch (e) { console.error(`  ❌ ${nombre}:`, e.message); process.exitCode = 1; }
}

const bodyBase = { Nombre: 'Ing. Test', usuario_ID_Usuario: '12345678-9' };

(async () => {
  console.log('\n== carrera requiere facultad válida ==');

  await check('crear sin facultad -> 400', async () => {
    const res = mockRes();
    await controller.crearCarrera({ body: { ...bodyBase } }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /facultad/i);
  });

  await check('crear con facultad inválida (texto) -> 400', async () => {
    const res = mockRes();
    await controller.crearCarrera({ body: { ...bodyBase, facultad_ID_Facultad: 'abc' } }, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await check('crear con facultad inexistente -> 400', async () => {
    const res = mockRes();
    await controller.crearCarrera({ body: { ...bodyBase, facultad_ID_Facultad: 99 } }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /no existe/i);
  });

  await check('crear con facultad válida -> 201', async () => {
    const res = mockRes();
    await controller.crearCarrera({ body: { ...bodyBase, facultad_ID_Facultad: 2 } }, res);
    assert.strictEqual(res.statusCode, 201);
  });

  await check('actualizar sin facultad -> 400', async () => {
    const res = mockRes();
    await controller.actualizarCarrera({ params: { id: '5' }, body: { ...bodyBase } }, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await check('actualizar con facultad válida -> 200', async () => {
    const res = mockRes();
    await controller.actualizarCarrera({ params: { id: '5' }, body: { ...bodyBase, facultad_ID_Facultad: 1 } }, res);
    assert.strictEqual(res.statusCode, 200);
  });

  console.log(`\n== carreraFacultad.test.js: ${passed} checks OK ==\n`);
})();
