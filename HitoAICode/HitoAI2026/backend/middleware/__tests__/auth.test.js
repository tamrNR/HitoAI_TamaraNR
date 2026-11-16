// Tests de autenticación/autorización: verifyAuth, authorizeRoles y scope por asignatura
// Stub de db/connection ANTES de requerir el middleware (no toca MySQL real)
const assert = require('assert');
const path = require('path');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-auth';

// Respuestas SQL controlables para los helpers de scope
let sqlQueue = [];
const connectionPath = require.resolve('../../db/connection');
require.cache[connectionPath] = {
  id: connectionPath,
  filename: connectionPath,
  loaded: true,
  exports: {
    query: (sql, params, cb) => {
      const next = sqlQueue.length ? sqlQueue.shift() : [];
      setImmediate(() => cb(null, next));
    }
  }
};

const jwt = require('jsonwebtoken');
const {
  verifyAuth,
  authorizeRoles,
  usuarioPuedeVerAsignatura,
  scopeAsignatura
} = require('../../middleware/auth.middleware');

const SECRET = process.env.JWT_SECRET;
const tokenDe = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1h' });

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; }
  };
}

let passed = 0;
function test(nombre, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${nombre}`);
  } catch (e) {
    console.error(`  ❌ ${nombre}:`, e.message);
    process.exitCode = 1;
  }
}

async function asyncTest(nombre, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${nombre}`);
  } catch (e) {
    console.error(`  ❌ ${nombre}:`, e.message);
    process.exitCode = 1;
  }
}

(async () => {
  console.log('\n== verifyAuth ==');

  await asyncTest('sin token -> 401', async () => {
    const res = mockRes();
    let next = false;
    verifyAuth({ headers: {} }, res, () => { next = true; });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(next, false);
  });

  await asyncTest('token inválido -> 401', async () => {
    const res = mockRes();
    verifyAuth({ headers: { authorization: 'Bearer no-es-jwt' } }, res, () => {});
    assert.strictEqual(res.statusCode, 401);
  });

  await asyncTest('token válido -> req.user poblado', async () => {
    const t = tokenDe({ sub: '12.345.678-9', nombre: 'Ana', rol: 'Profesor', carreraId: 3, facultadId: 1 });
    const req = { headers: { authorization: `Bearer ${t}` } };
    const res = mockRes();
    let next = false;
    verifyAuth(req, res, () => { next = true; });
    assert.strictEqual(next, true);
    assert.strictEqual(req.user.id, '12.345.678-9');
    assert.strictEqual(req.user.rol, 'Profesor');
    assert.strictEqual(req.user.carreraId, 3);
  });

  console.log('\n== authorizeRoles ==');

  test('rol permitido -> next()', () => {
    const mw = authorizeRoles('Administrador', 'Jefe de Carrera');
    const req = { user: { rol: 'Jefe de Carrera' } };
    const res = mockRes();
    let next = false;
    mw(req, res, () => { next = true; });
    assert.strictEqual(next, true);
  });

  test('rol no permitido -> 403', () => {
    const mw = authorizeRoles('Administrador');
    const req = { user: { rol: 'Profesor' } };
    const res = mockRes();
    let next = false;
    mw(req, res, () => { next = true; });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(next, false);
  });

  test('sin req.user -> 401', () => {
    const mw = authorizeRoles('Administrador');
    const res = mockRes();
    mw({}, res, () => {});
    assert.strictEqual(res.statusCode, 401);
  });

  test('normaliza acentos (Comité Curricular)', () => {
    const mw = authorizeRoles('Comité Curricular');
    const req = { user: { rol: 'Comite Curricular' } };
    const res = mockRes();
    let next = false;
    mw(req, res, () => { next = true; });
    assert.strictEqual(next, true);
  });

  console.log('\n== usuarioPuedeVerAsignatura ==');

  const asignatura = { ID_Asignatura: 'TIS800', carrera_ID_Carrera: 5, usuario_ID_Usuario: '11.111.111-1', facultad_ID_Facultad: 2 };

  test('Administrador ve todo', () => {
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Administrador' }, asignatura), true);
  });

  test('Profesor solo sus asignaturas', () => {
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Profesor', id: '11.111.111-1' }, asignatura), true);
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Profesor', id: '99.999.999-9' }, asignatura), false);
  });

  test('Jefe/Comité solo su carrera', () => {
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Jefe de Carrera', carreraId: 5 }, asignatura), true);
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Jefe de Carrera', carreraId: 7 }, asignatura), false);
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Comité Curricular', carreraId: 5 }, asignatura), true);
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Comité Curricular', carreraId: 8 }, asignatura), false);
  });

  test('Decano solo su facultad', () => {
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Decano', facultadId: 2 }, asignatura), true);
    assert.strictEqual(usuarioPuedeVerAsignatura({ rol: 'Decano', facultadId: 9 }, asignatura), false);
  });

  console.log('\n== scopeAsignatura ==');

  await asyncTest('asignatura ajena -> 403', async () => {
    sqlQueue = [[asignatura]];
    const req = { user: { rol: 'Profesor', id: '99.999.999-9' }, params: { id: 'TIS800' } };
    const res = mockRes();
    let next = false;
    await scopeAsignatura(r => r.params.id)(req, res, () => { next = true; });
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(next, false);
  });

  await asyncTest('asignatura propia -> next()', async () => {
    sqlQueue = [[asignatura]];
    const req = { user: { rol: 'Profesor', id: '11.111.111-1' }, params: { id: 'TIS800' } };
    const res = mockRes();
    let next = false;
    await scopeAsignatura(r => r.params.id)(req, res, () => { next = true; });
    assert.strictEqual(next, true);
    assert.strictEqual(res.statusCode, null);
  });

  await asyncTest('asignatura inexistente -> 404', async () => {
    sqlQueue = [[]];
    const req = { user: { rol: 'Administrador' }, params: { id: 'NOPE' } };
    const res = mockRes();
    await scopeAsignatura(r => r.params.id)(req, res, () => {});
    assert.strictEqual(res.statusCode, 404);
  });

  console.log(`\n== auth.test.js: ${passed} checks OK ==\n`);
})();
