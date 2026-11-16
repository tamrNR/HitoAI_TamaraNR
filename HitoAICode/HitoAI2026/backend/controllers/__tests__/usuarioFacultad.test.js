// Regla: el rol Decano exige Facultad_ID_Facultad en crear y en cambio de rol.
// Stub de db/connection: responde según el SQL (rol lookup / existe / insert / update)
const assert = require('assert');

const connectionPath = require.resolve('../../db/connection');
// Roles simulados: ID_Rol 5 = Decano, 3 = Profesor
const ROLES = { 5: 'Decano', 3: 'Profesor' };
require.cache[connectionPath] = {
  id: connectionPath, filename: connectionPath, loaded: true,
  exports: {
    query: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      let rows = [];
      if (/SELECT Nombre FROM rol/i.test(sql)) {
        rows = [{ Nombre: ROLES[params[0]] || 'Otro' }];
      } else if (/INSERT INTO usuario/i.test(sql) || /UPDATE usuario/i.test(sql)) {
        rows = { affectedRows: 1 };
      }
      setImmediate(() => cb(null, Array.isArray(rows) ? rows : [rows]));
    }
  }
};

const controller = require('../../controllers/usuario.controller');

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

(async () => {
  console.log('\n== usuario Decano requiere facultad ==');

  await check('POST crear: Decano sin facultad -> 400', async () => {
    const res = mockRes();
    await controller.crearUsuario({
      body: { ID_Usuario: '11.111.111-1', Nombre: 'Dec Test', Clave: 'ClaveSegura1!', Rol_ID_Rol: 5 }
    }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /facultad/i);
  });

  await check('POST crear: Decano con facultad -> 201', async () => {
    const res = mockRes();
    await controller.crearUsuario({
      body: { ID_Usuario: '11.111.111-2', Nombre: 'Dec Test', Clave: 'ClaveSegura1!', Rol_ID_Rol: 5, Facultad_ID_Facultad: 2 }
    }, res);
    assert.strictEqual(res.statusCode, 201);
  });

  await check('POST crear: Profesor sin facultad -> 201', async () => {
    const res = mockRes();
    await controller.crearUsuario({
      body: { ID_Usuario: '11.111.111-3', Nombre: 'Prof Test', Clave: 'ClaveSegura1!', Rol_ID_Rol: 3 }
    }, res);
    assert.strictEqual(res.statusCode, 201);
  });

  await check('PUT rol/:id a Decano sin facultadId -> 400', async () => {
    const res = mockRes();
    await controller.actualizarRol({
      params: { id: '11.111.111-1' }, body: { rolId: 5 }
    }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /facultad/i);
  });

  await check('PUT rol/:id a Decano con facultadId -> 200', async () => {
    const res = mockRes();
    await controller.actualizarRol({
      params: { id: '11.111.111-1' }, body: { rolId: 5, facultadId: 2 }
    }, res);
    assert.strictEqual(res.statusCode, 200);
  });

  await check('PUT rol/:id a Profesor sin facultadId -> 200', async () => {
    const res = mockRes();
    await controller.actualizarRol({
      params: { id: '11.111.111-1' }, body: { rolId: 3 }
    }, res);
    assert.strictEqual(res.statusCode, 200);
  });

  console.log(`\n== usuarioFacultad.test.js: ${passed} checks OK ==\n`);
})();
