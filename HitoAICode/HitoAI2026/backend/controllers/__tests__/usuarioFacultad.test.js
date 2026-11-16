// Reglas de ámbito en usuarios:
//  - Decano exige Facultad_ID_Facultad (crear y cambio de rol)
//  - Comité Curricular exige Carrera_ID_Carrera existente (crear y cambio de rol)
//  - Los demás roles limpian facultad/carrera
// Stub de db/connection: responde según el SQL, sin MySQL real
const assert = require('assert');

const connectionPath = require.resolve('../../db/connection');
// Roles simulados
const ROLES = { 5: 'Decano', 3: 'Profesor', 6: 'Comité Curricular', 4: 'Jefe de Carrera' };
const CARRERAS = new Set([5, 8]);
const FACULTADES = new Set([1, 2]);
let ultimosParams = null;
let ultimoSql = null;

require.cache[connectionPath] = {
  id: connectionPath, filename: connectionPath, loaded: true,
  exports: {
    query: (sql, params, cb) => {
      if (typeof params === 'function') { cb = params; params = []; }
      ultimosParams = params;
      ultimoSql = sql;
      let rows = [];
      if (/SELECT Nombre FROM rol/i.test(sql)) {
        rows = [{ Nombre: ROLES[params[0]] || 'Otro' }];
      } else if (/FROM carrera WHERE ID_Carrera/i.test(sql)) {
        rows = CARRERAS.has(Number(params[0])) ? [{ '?column?': 1 }] : [];
      } else if (/FROM facultad WHERE ID_Facultad/i.test(sql)) {
        rows = FACULTADES.has(Number(params[0])) ? [{ '?column?': 1 }] : [];
      } else if (/INSERT INTO|UPDATE usuario/i.test(sql)) {
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

const base = { ID_Usuario: '11.111.111-1', Nombre: 'Test', Clave: 'ClaveSegura1!' };

(async () => {
  console.log('\n== Decano requiere facultad ==');

  await check('crear Decano sin facultad -> 400', async () => {
    const res = mockRes();
    await controller.crearUsuario({ body: { ...base, Rol_ID_Rol: 5 } }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /facultad/i);
  });

  await check('crear Decano con facultad -> 201', async () => {
    const res = mockRes();
    await controller.crearUsuario({ body: { ...base, Rol_ID_Rol: 5, Facultad_ID_Facultad: 2 } }, res);
    assert.strictEqual(res.statusCode, 201);
  });

  console.log('\n== Comité requiere carrera existente ==');

  await check('crear Comité sin carrera -> 400', async () => {
    const res = mockRes();
    await controller.crearUsuario({ body: { ...base, Rol_ID_Rol: 6 } }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /carrera/i);
  });

  await check('crear Comité con carrera inexistente -> 400', async () => {
    const res = mockRes();
    await controller.crearUsuario({ body: { ...base, Rol_ID_Rol: 6, Carrera_ID_Carrera: 999 } }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /no existe/i);
  });

  await check('crear Comité con carrera válida -> 201', async () => {
    const res = mockRes();
    await controller.crearUsuario({ body: { ...base, Rol_ID_Rol: 6, Carrera_ID_Carrera: 5 } }, res);
    assert.strictEqual(res.statusCode, 201);
    assert.ok(ultimosParams.includes(5), 'INSERT debe incluir Carrera_ID_Carrera=5');
  });

  await check('crear Profesor con carrera enviada -> se limpia (NULL)', async () => {
    const res = mockRes();
    await controller.crearUsuario({
      body: { ...base, Rol_ID_Rol: 3, Carrera_ID_Carrera: 5, Facultad_ID_Facultad: 2 }
    }, res);
    assert.strictEqual(res.statusCode, 201);
    assert.ok(!/Carrera_ID_Carrera|Facultad_ID_Facultad/.test(ultimoSql), 'INSERT no debe incluir columnas de ámbito para roles sin ámbito');
  });

  console.log('\n== actualizarRol ==');

  await check('cambiar a Decano sin facultad -> 400', async () => {
    const res = mockRes();
    await controller.actualizarRol({ params: { id: '1' }, body: { rolId: 5 } }, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await check('cambiar a Comité sin carrera -> 400', async () => {
    const res = mockRes();
    await controller.actualizarRol({ params: { id: '1' }, body: { rolId: 6 } }, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.body.message, /carrera/i);
  });

  await check('cambiar a Comité con carrera inexistente -> 400', async () => {
    const res = mockRes();
    await controller.actualizarRol({ params: { id: '1' }, body: { rolId: 6, carreraId: 999 } }, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await check('cambiar a Comité con carrera válida -> 200', async () => {
    const res = mockRes();
    await controller.actualizarRol({ params: { id: '1' }, body: { rolId: 6, carreraId: 8 } }, res);
    assert.strictEqual(res.statusCode, 200);
    assert.ok(ultimosParams.includes(8), 'UPDATE debe incluir Carrera_ID_Carrera=8');
  });

  await check('cambiar a Profesor limpia facultad y carrera -> 200', async () => {
    const res = mockRes();
    await controller.actualizarRol({ params: { id: '1' }, body: { rolId: 3 } }, res);
    assert.strictEqual(res.statusCode, 200);
    const tail = ultimosParams.slice(0, -1); // sin el id final
    assert.deepStrictEqual(tail, [3, null, null], 'rolId + facultad NULL + carrera NULL');
  });

  console.log(`\n== usuarioFacultad.test.js: ${passed} checks OK ==\n`);
})();
