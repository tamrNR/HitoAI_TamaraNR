const connection = require('../db/connection');
const pool = require('../db/pool');

// 1. Trae los indicadores de una evaluación + asignatura
exports.obtenerIndicadoresPorEvaluacion = (evaluacionID, asignaturaID) => {
  const sql = `
    SELECT DISTINCT i.ID_Indicador, i.Descripcion, i.Puntaje_Max
    FROM indicador i
    JOIN contenido c ON i.contenido_ID_Contenido = c.ID_Contenido
    WHERE c.asignatura_ID_Asignatura = ?
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [asignaturaID], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// 2. Valida que el payload cubra TODOS los indicadores de la asignatura
//    y que cada puntaje sea entero entre 1 y Puntaje_Max (leído de BD).
exports.validarPuntajesGrupo = async (grupos) => {
  if (!Array.isArray(grupos) || grupos.length === 0) {
    return { ok: false, mensaje: 'Payload inválido: se requiere una lista de indicadores.' };
  }

  const { evaluacionID, asignaturaID } = grupos[0];
  for (const g of grupos) {
    if (Number(g.evaluacionID) !== Number(evaluacionID) || String(g.asignaturaID) !== String(asignaturaID)) {
      return { ok: false, mensaje: 'Todos los registros deben pertenecer a la misma evaluación y asignatura.' };
    }
    if (!Array.isArray(g.estudiantes) || g.estudiantes.length === 0) {
      return { ok: false, mensaje: 'Cada indicador debe incluir al menos un estudiante.' };
    }
  }

  const indicadores = await exports.obtenerIndicadoresPorEvaluacion(evaluacionID, asignaturaID);
  const maxPorIndicador = new Map();
  for (const ind of indicadores) {
    const id = Number(ind.ID_Indicador);
    if (!maxPorIndicador.has(id)) maxPorIndicador.set(id, Number(ind.Puntaje_Max));
  }

  const recibidos = new Set(grupos.map(g => Number(g.indicadorID)));
  for (const id of maxPorIndicador.keys()) {
    if (!recibidos.has(id)) {
      return { ok: false, mensaje: `Falta puntaje para el indicador ${id}. Todos los indicadores de la asignatura son obligatorios.` };
    }
  }

  for (const g of grupos) {
    const id = Number(g.indicadorID);
    const max = maxPorIndicador.get(id);
    if (max === undefined) {
      return { ok: false, mensaje: `El indicador ${id} no pertenece a la asignatura ${asignaturaID}.` };
    }
    const v = Number(g.obtenido);
    if (g.obtenido === null || g.obtenido === undefined ||
        !Number.isInteger(v) || v < 1 || v > max) {
      return { ok: false, mensaje: `El puntaje del indicador ${id} debe ser un entero entre 1 y ${max}.` };
    }
  }

  return { ok: true };
};

// 3. UPSERT de puntajes por grupo dentro de una transacción.
//    Por cada (indicador × estudiante): inserta la fila si no existe y luego actualiza.
exports.actualizarPuntajesGrupo = async (grupos) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const g of grupos) {
      for (const estudianteID of g.estudiantes) {
        // INSERT si no existe: copia el Grupo que el estudiante ya tiene
        // en esa evaluación (0 si aún no está en ninguno)
        await conn.query(`
          INSERT INTO aplicacion (inscripcion_ID_Inscripcion, evaluacion_ID_Evaluacion, indicador_ID_Indicador, Obtenido, Grupo)
          SELECT ins.ID_Inscripcion, ?, ?, 0,
                 COALESCE((
                   SELECT a2.Grupo
                   FROM aplicacion a2
                   WHERE a2.inscripcion_ID_Inscripcion = ins.ID_Inscripcion
                     AND a2.evaluacion_ID_Evaluacion = ?
                   LIMIT 1
                 ), 0)
          FROM inscripcion ins
          WHERE ins.estudiante_ID_Estudiante = ?
            AND ins.asignatura_ID_Asignatura = ?
            AND NOT EXISTS (
              SELECT 1 FROM aplicacion a
              WHERE a.inscripcion_ID_Inscripcion = ins.ID_Inscripcion
                AND a.evaluacion_ID_Evaluacion = ?
                AND a.indicador_ID_Indicador = ?
            )
        `, [g.evaluacionID, g.indicadorID, g.evaluacionID, estudianteID, g.asignaturaID, g.evaluacionID, g.indicadorID]);

        await conn.query(`
          UPDATE aplicacion a
          JOIN inscripcion ins ON a.inscripcion_ID_Inscripcion = ins.ID_Inscripcion
          SET a.Obtenido = ?
          WHERE ins.estudiante_ID_Estudiante = ?
            AND ins.asignatura_ID_Asignatura = ?
            AND a.evaluacion_ID_Evaluacion = ?
            AND a.indicador_ID_Indicador = ?
        `, [g.obtenido, estudianteID, g.asignaturaID, g.evaluacionID, g.indicadorID]);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// 3. Estudiantes que ya han sido evaluados (Obtenido > 0)
exports.obtenerEstudiantesAplicados = (evaluacionID, asignaturaID) => {
  const sql = `
    SELECT DISTINCT e.ID_Estudiante
    FROM aplicacion a
    JOIN inscripcion i ON a.inscripcion_ID_Inscripcion = i.ID_Inscripcion
    JOIN estudiante e ON i.estudiante_ID_Estudiante = e.ID_Estudiante
    WHERE a.evaluacion_ID_Evaluacion = ?
      AND i.asignatura_ID_Asignatura = ?
      AND (a.Obtenido IS NOT NULL AND a.Obtenido > 0)
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [evaluacionID, asignaturaID], (err, results) => {
      if (err) return reject(err);
      const ids = results.map(r => r.ID_Estudiante);
      resolve(ids);
    });
  });
};

// 4. Todas las aplicaciones evaluadas (con puntaje > 0)
exports.obtenerAplicacionesEvaluadas = (evaluacionID, asignaturaID) => {
  const sql = `
    SELECT 
      a.Obtenido,
      a.Grupo,
      a.evaluacion_ID_Evaluacion,
      a.indicador_ID_Indicador,
      i.ID_Inscripcion,
      e.ID_Estudiante,
      e.Nombre,
      e.Apellido,
      ind.Descripcion,
      ind.Puntaje_Max
    FROM aplicacion a
    JOIN inscripcion i ON a.inscripcion_ID_Inscripcion = i.ID_Inscripcion
    JOIN estudiante e ON i.estudiante_ID_Estudiante = e.ID_Estudiante
    JOIN indicador ind ON a.indicador_ID_Indicador = ind.ID_Indicador
    WHERE a.evaluacion_ID_Evaluacion = ?
      AND i.asignatura_ID_Asignatura = ?
      AND a.Obtenido > 0
    ORDER BY a.Grupo ASC, a.ID_Aplicacion ASC
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [evaluacionID, asignaturaID], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// 5. Obtener todos los números de grupo existentes para una evaluación
exports.obtenerGruposPorEvaluacion = (evaluacionID, asignaturaID) => {
  const sql = `
    SELECT DISTINCT a.Grupo
    FROM aplicacion a
    JOIN inscripcion i ON a.inscripcion_ID_Inscripcion = i.ID_Inscripcion
    WHERE a.evaluacion_ID_Evaluacion = ?
      AND i.asignatura_ID_Asignatura = ?
      AND a.Grupo > 0
    ORDER BY a.Grupo ASC
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [evaluacionID, asignaturaID], (err, results) => {
      if (err) return reject(err);
      const grupos = results.map(r => r.Grupo);
      resolve(grupos);
    });
  });
};

// 6. Asigna un número de grupo a todos los estudiantes + indicadores
exports.asignarGrupoAGrupo = (grupo, grupoNumero) => {
  const actualizaciones = [];

  for (const estudianteID of grupo.estudiantes) {
    const sql = `
      UPDATE aplicacion a
      JOIN inscripcion ins ON a.inscripcion_ID_Inscripcion = ins.ID_Inscripcion
      SET a.Grupo = ?
      WHERE ins.estudiante_ID_Estudiante = ?
        AND ins.asignatura_ID_Asignatura = ?
        AND a.evaluacion_ID_Evaluacion = ?
    `;

    const params = [grupoNumero, estudianteID, grupo.asignaturaID, grupo.evaluacionID];

    actualizaciones.push(
      new Promise((resolve, reject) => {
        connection.query(sql, params, (err) => (err ? reject(err) : resolve()));
      })
    );
  }

  return Promise.all(actualizaciones);
};
// ✅ NUEVO: Traer aplicaciones agrupadas aunque tengan puntaje 0
exports.obtenerAplicacionesAgrupadas = (evaluacionID, asignaturaID) => {
  const sql = `
    SELECT 
      a.Grupo,
      a.Obtenido,
      a.evaluacion_ID_Evaluacion,
      a.indicador_ID_Indicador,
      i.ID_Inscripcion,
      e.ID_Estudiante,
      e.Nombre,
      e.Apellido,
      ind.Descripcion,
      ind.Puntaje_Max
    FROM aplicacion a
    JOIN inscripcion i ON a.inscripcion_ID_Inscripcion = i.ID_Inscripcion
    JOIN estudiante e ON i.estudiante_ID_Estudiante = e.ID_Estudiante
    JOIN indicador ind ON a.indicador_ID_Indicador = ind.ID_Indicador
    WHERE a.evaluacion_ID_Evaluacion = ?
      AND i.asignatura_ID_Asignatura = ?
      AND a.Grupo > 0
    ORDER BY a.Grupo ASC, a.ID_Aplicacion ASC
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [evaluacionID, asignaturaID], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
exports.obtenerPuntajesEstudiante = (evaluacionID, asignaturaID, estudianteID) => {
  const sql = `
    SELECT a.indicador_ID_Indicador, a.Obtenido
    FROM aplicacion a
    JOIN inscripcion i ON a.inscripcion_ID_Inscripcion = i.ID_Inscripcion
    WHERE a.evaluacion_ID_Evaluacion = ?
      AND i.asignatura_ID_Asignatura = ?
      AND i.estudiante_ID_Estudiante = ?
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, [evaluacionID, asignaturaID, estudianteID], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Crea un placeholder en aplicacion si no existe ya (SELECT antes de INSERT)
exports.crearPlaceholderSiNoExiste = (inscripcionID, evaluacionID, indicadorID) => {
  const sqlCheck = `SELECT 1 FROM aplicacion WHERE inscripcion_ID_Inscripcion = ? AND evaluacion_ID_Evaluacion = ? AND indicador_ID_Indicador = ? LIMIT 1`;
  const sqlInsert = `INSERT INTO aplicacion (Obtenido, Grupo, inscripcion_ID_Inscripcion, evaluacion_ID_Evaluacion, indicador_ID_Indicador) VALUES (0, 0, ?, ?, ?)`;
  
  return new Promise((resolve, reject) => {
    connection.query(sqlCheck, [inscripcionID, evaluacionID, indicadorID], (err, results) => {
      if (err) return reject(err);
      if (results.length > 0) return resolve(); // ya existe, no insertar
      connection.query(sqlInsert, [inscripcionID, evaluacionID, indicadorID], (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });
};
