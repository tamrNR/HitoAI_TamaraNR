// Middleware de autenticación (JWT) y autorización por rol + scope
const jwt = require('jsonwebtoken');
const connection = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET;

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    connection.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

// ---------------------------------------------------------------
// verifyAuth: exige "Authorization: Bearer <jwt>" y fija req.user
// req.user = { id, nombre, rol, carreraId, facultadId }
// ---------------------------------------------------------------
const verifyAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!JWT_SECRET) {
    console.error('[Auth] JWT_SECRET no configurado');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      nombre: payload.nombre || '',
      rol: payload.rol,
      carreraId: payload.carreraId ?? null,
      facultadId: payload.facultadId ?? null
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// ---------------------------------------------------------------
// authorizeRoles(...roles): usa SOLO req.user.rol (requiere verifyAuth)
// ---------------------------------------------------------------
const authorizeRoles = (...allowedRoles) => {
  const allowed = allowedRoles.map(normalize);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!allowed.includes(normalize(req.user.rol))) {
      return res.status(403).json({ error: 'No autorizado: rol sin permiso para este recurso' });
    }
    next();
  };
};

// ---------------------------------------------------------------
// Scope por recurso: verifica que la asignatura/evaluación/etc.
// pertenezca al ámbito del usuario del token (nunca del cliente).
//   Administrador        -> todo
//   Profesor             -> asignaturas donde es usuario_ID_Usuario
//   Jefe de Carrera      -> asignaturas de su carrera (JWT.carreraId)
//   Comité Curricular    -> asignaturas de su carrera (JWT.carreraId)
//   Decano               -> asignaturas de su facultad (JWT.facultadId)
// ---------------------------------------------------------------
async function obtenerScopeAsignatura(asignaturaId) {
  const rows = await query(
    `SELECT a.ID_Asignatura, a.carrera_ID_Carrera, a.usuario_ID_Usuario,
            c.facultad_ID_Facultad
     FROM asignatura a
     JOIN carrera c ON c.ID_Carrera = a.carrera_ID_Carrera
     WHERE a.ID_Asignatura = ?
     LIMIT 1`,
    [asignaturaId]
  );
  return rows[0] || null;
}

function usuarioPuedeVerAsignatura(user, asignatura) {
  if (!user || !asignatura) return false;
  if (normalize(user.rol) === 'administrador') return true;
  if (normalize(user.rol) === 'profesor') {
    return String(asignatura.usuario_ID_Usuario) === String(user.id);
  }
  const rol = normalize(user.rol);
  if (rol === 'jefe de carrera' || rol === 'comite curricular') {
    return Number(asignatura.carrera_ID_Carrera) === Number(user.carreraId);
  }
  if (rol === 'decano') {
    return Number(asignatura.facultad_ID_Facultad) === Number(user.facultadId);
  }
  return false;
}

async function resolverAsignaturaIdPorEvaluacion(evaluacionId) {
  const rows = await query(
    `SELECT asignatura_ID_Asignatura FROM evaluacion WHERE ID_Evaluacion = ? LIMIT 1`,
    [evaluacionId]
  );
  return rows[0]?.asignatura_ID_Asignatura || null;
}

async function resolverAsignaturaIdPorContenido(contenidoId) {
  const rows = await query(
    `SELECT asignatura_ID_Asignatura FROM contenido WHERE ID_Contenido = ? LIMIT 1`,
    [contenidoId]
  );
  return rows[0]?.asignatura_ID_Asignatura || null;
}

async function resolverAsignaturaIdPorIndicador(indicadorId) {
  const rows = await query(
    `SELECT c.asignatura_ID_Asignatura
     FROM indicador i
     JOIN contenido c ON c.ID_Contenido = i.contenido_ID_Contenido
     WHERE i.ID_Indicador = ? LIMIT 1`,
    [indicadorId]
  );
  return rows[0]?.asignatura_ID_Asignatura || null;
}

async function resolverAsignaturaIdPorRA(raId) {
  const rows = await query(
    `SELECT asignatura_ID_Asignatura FROM ra WHERE ID_RA = ? LIMIT 1`,
    [raId]
  );
  return rows[0]?.asignatura_ID_Asignatura || null;
}

async function resolverAsignaturaIdPorInscripcion(inscripcionId) {
  const rows = await query(
    `SELECT asignatura_ID_Asignatura FROM inscripcion WHERE ID_Inscripcion = ? LIMIT 1`,
    [inscripcionId]
  );
  return rows[0]?.asignatura_ID_Asignatura || null;
}

// Verifica scope dado un ID de asignatura ya resuelto
async function checkAsignatura(req, res, asignaturaId) {
  if (asignaturaId === undefined || asignaturaId === null || asignaturaId === '') {
    return res.status(400).json({ error: 'No se pudo determinar la asignatura del recurso' });
  }
  const asignatura = await obtenerScopeAsignatura(asignaturaId);
  if (!asignatura) {
    return res.status(404).json({ error: 'Asignatura no encontrada' });
  }
  if (!usuarioPuedeVerAsignatura(req.user, asignatura)) {
    return res.status(403).json({ error: 'No autorizado: el recurso no pertenece a tu ámbito' });
  }
  req.asignaturaScope = asignatura;
  return null;
}

// Factory: getId(req) -> id de asignatura (params/query/body ya resuelto por el llamador)
const scopeAsignatura = (getId) => async (req, res, next) => {
  try {
    const err = await checkAsignatura(req, res, getId(req));
    if (err) return;
    next();
  } catch (e) {
    console.error('[Scope] Error verificando asignatura:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

const scopeEvaluacion = (getId) => async (req, res, next) => {
  try {
    const evalId = getId(req);
    if (evalId === undefined || evalId === null || evalId === '') {
      return res.status(400).json({ error: 'No se pudo determinar la evaluación' });
    }
    const asignaturaId = await resolverAsignaturaIdPorEvaluacion(evalId);
    const err = await checkAsignatura(req, res, asignaturaId);
    if (err) return;
    next();
  } catch (e) {
    console.error('[Scope] Error verificando evaluación:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

const scopeContenido = (getId) => async (req, res, next) => {
  try {
    const contenidoId = getId(req);
    if (contenidoId === undefined || contenidoId === null || contenidoId === '') {
      return res.status(400).json({ error: 'No se pudo determinar el contenido' });
    }
    const asignaturaId = await resolverAsignaturaIdPorContenido(contenidoId);
    const err = await checkAsignatura(req, res, asignaturaId);
    if (err) return;
    next();
  } catch (e) {
    console.error('[Scope] Error verificando contenido:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

const scopeIndicador = (getId) => async (req, res, next) => {
  try {
    const indicadorId = getId(req);
    if (indicadorId === undefined || indicadorId === null || indicadorId === '') {
      return res.status(400).json({ error: 'No se pudo determinar el indicador' });
    }
    const asignaturaId = await resolverAsignaturaIdPorIndicador(indicadorId);
    const err = await checkAsignatura(req, res, asignaturaId);
    if (err) return;
    next();
  } catch (e) {
    console.error('[Scope] Error verificando indicador:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

const scopeRA = (getId) => async (req, res, next) => {
  try {
    const raId = getId(req);
    if (raId === undefined || raId === null || raId === '') {
      return res.status(400).json({ error: 'No se pudo determinar el RA' });
    }
    const asignaturaId = await resolverAsignaturaIdPorRA(raId);
    const err = await checkAsignatura(req, res, asignaturaId);
    if (err) return;
    next();
  } catch (e) {
    console.error('[Scope] Error verificando RA:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

const scopeInscripcion = (getId) => async (req, res, next) => {
  try {
    const inscId = getId(req);
    if (inscId === undefined || inscId === null || inscId === '') {
      return res.status(400).json({ error: 'No se pudo determinar la inscripción' });
    }
    const asignaturaId = await resolverAsignaturaIdPorInscripcion(inscId);
    const err = await checkAsignatura(req, res, asignaturaId);
    if (err) return;
    next();
  } catch (e) {
    console.error('[Scope] Error verificando inscripción:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// Scope por carrera (para rutas /api/carrera y /api/comite)
// Si getId no entrega un id, deja pasar (el endpoint decide si el parámetro es obligatorio)
const scopeCarrera = (getId) => async (req, res, next) => {
  try {
    const carreraId = getId(req);
    if (carreraId === undefined || carreraId === null || carreraId === '') {
      return next();
    }
    const rows = await query(
      `SELECT ID_Carrera, facultad_ID_Facultad FROM carrera WHERE ID_Carrera = ? LIMIT 1`,
      [carreraId]
    );
    const carrera = rows[0];
    if (!carrera) return res.status(404).json({ error: 'Carrera no encontrada' });

    const rol = normalize(req.user.rol);
    let ok = false;
    if (rol === 'administrador') ok = true;
    else if (rol === 'jefe de carrera' || rol === 'comite curricular') {
      ok = Number(carrera.ID_Carrera) === Number(req.user.carreraId);
    } else if (rol === 'decano') {
      ok = Number(carrera.facultad_ID_Facultad) === Number(req.user.facultadId);
    } else if (rol === 'profesor') {
      const rows2 = await query(
        `SELECT 1 FROM asignatura WHERE carrera_ID_Carrera = ? AND usuario_ID_Usuario = ? LIMIT 1`,
        [carrera.ID_Carrera, req.user.id]
      );
      ok = rows2.length > 0;
    }
    if (!ok) return res.status(403).json({ error: 'No autorizado: la carrera no pertenece a tu ámbito' });
    next();
  } catch (e) {
    console.error('[Scope] Error verificando carrera:', e?.message || e);
    return res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// Traduce req.user a un scope SQL para listados (null = sin restricción, solo Admin)
function scopeDesdeUsuario(user) {
  const rol = normalize(user?.rol);
  if (rol === 'administrador') return null;
  if (rol === 'jefe de carrera' || rol === 'comite curricular') {
    return { carreraId: user.carreraId ?? -1 };
  }
  if (rol === 'decano') {
    return { facultadId: user.facultadId ?? -1 };
  }
  if (rol === 'profesor') {
    return { profesorId: user.id };
  }
  return { carreraId: -1 };
}

module.exports = {
  verifyAuth,
  authorizeRoles,
  normalize,
  scopeDesdeUsuario,
  obtenerScopeAsignatura,
  usuarioPuedeVerAsignatura,
  scopeAsignatura,
  scopeEvaluacion,
  scopeContenido,
  scopeIndicador,
  scopeRA,
  scopeInscripcion,
  scopeCarrera
};
