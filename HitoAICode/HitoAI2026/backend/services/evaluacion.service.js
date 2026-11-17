const connection = require('../db/connection');

exports.contarPorAsignatura = (asignaturaID) => {
  const sql = `SELECT COUNT(*) AS total FROM evaluacion WHERE asignatura_ID_Asignatura = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [asignaturaID], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].total);
    });
  });
};

exports.crearConAplicaciones = async (data) => {
  const { Nombre, Tipo, N_Instancia, Fecha, asignatura_ID_Asignatura } = data;

  if (!asignatura_ID_Asignatura) {
    throw new Error('Debe enviar el ID de la asignatura');
  }

  const pool = require('../db/pool');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [evResult] = await conn.query(
      `INSERT INTO evaluacion (Nombre, Tipo, N_Instancia, Fecha, asignatura_ID_Asignatura)
       VALUES (?, ?, ?, ?, ?)`,
      [Nombre, Tipo, N_Instancia, Fecha, asignatura_ID_Asignatura]
    );
    const evaluacionID = evResult.insertId;

    // Misma lógica que AplicacionService.obtenerIndicadoresPorEvaluacion:
    // TODOS los indicadores de TODOS los contenidos de la asignatura.
    const [indicadores] = await conn.query(
      `SELECT DISTINCT i.ID_Indicador
       FROM indicador i
       JOIN contenido c ON i.contenido_ID_Contenido = c.ID_Contenido
       WHERE c.asignatura_ID_Asignatura = ?`,
      [asignatura_ID_Asignatura]
    );
    if (indicadores.length === 0) {
      throw new Error('La asignatura no tiene indicadores asociados.');
    }

    // Regla de negocio: toda evaluación evalúa TODOS los indicadores de la
    // asignatura para TODOS los alumnos inscritos. Obtenido = 0 = pendiente.
    // Si no hay inscritos se crea la evaluación igual, sin filas en aplicacion.
    const [inscripciones] = await conn.query(
      `SELECT ID_Inscripcion FROM inscripcion WHERE asignatura_ID_Asignatura = ?`,
      [asignatura_ID_Asignatura]
    );
    if (inscripciones.length > 0) {
      await conn.query(
        `INSERT INTO aplicacion (inscripcion_ID_Inscripcion, evaluacion_ID_Evaluacion, indicador_ID_Indicador, Obtenido, Grupo)
         SELECT DISTINCT ins.ID_Inscripcion, ?, i.ID_Indicador, 0, 0
         FROM inscripcion ins
         JOIN contenido c ON c.asignatura_ID_Asignatura = ins.asignatura_ID_Asignatura
         JOIN indicador i ON i.contenido_ID_Contenido = c.ID_Contenido
         WHERE ins.asignatura_ID_Asignatura = ?
           AND NOT EXISTS (
             SELECT 1 FROM aplicacion a
             WHERE a.inscripcion_ID_Inscripcion = ins.ID_Inscripcion
               AND a.evaluacion_ID_Evaluacion = ?
               AND a.indicador_ID_Indicador = i.ID_Indicador
           )`,
        [evaluacionID, asignatura_ID_Asignatura, evaluacionID]
      );
    }

    await conn.commit();
    return { evaluacionID };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.obtenerPorAsignatura = (asignaturaID) => {
  const sql = `
    SELECT * FROM evaluacion
    WHERE asignatura_ID_Asignatura = ?
    ORDER BY Fecha DESC, ID_Evaluacion DESC
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [asignaturaID], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
exports.obtenerContenidosUsados = (asignaturaID) => {
  const sql = `
    SELECT DISTINCT c.ID_Contenido
    FROM contenido c
    JOIN indicador i ON i.contenido_ID_Contenido = c.ID_Contenido
    JOIN aplicacion a ON a.indicador_ID_Indicador = i.ID_Indicador
    JOIN evaluacion e ON e.ID_Evaluacion = a.evaluacion_ID_Evaluacion
    WHERE c.asignatura_ID_Asignatura = ?
      AND e.asignatura_ID_Asignatura = ?
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [asignaturaID, asignaturaID], (err, results) => {
      if (err) return reject(err);
      const usados = results.map(r => r.ID_Contenido);
      resolve(usados);
    });
  });
};

exports.eliminar = (id) => {
  const borrarEvaluacionEstudiante = 'DELETE FROM evaluacion_estudiante WHERE ID_Evaluacion = ?';
  const borrarAplicaciones = 'DELETE FROM aplicacion WHERE evaluacion_ID_Evaluacion = ?';
  const borrarEvaluacion = 'DELETE FROM evaluacion WHERE ID_Evaluacion = ?';

  return new Promise((resolve, reject) => {
    connection.beginTransaction((err) => {
      if (err) return reject(err);

      connection.query(borrarEvaluacionEstudiante, [id], (err0) => {
        if (err0) {
          return connection.rollback(() => reject(err0));
        }

        connection.query(borrarAplicaciones, [id], (err1) => {
          if (err1) {
            return connection.rollback(() => reject(err1));
          }

          connection.query(borrarEvaluacion, [id], (err2) => {
            if (err2) {
              return connection.rollback(() => reject(err2));
            }

            connection.commit((err3) => {
              if (err3) {
                return connection.rollback(() => reject(err3));
              }
              resolve();
            });
          });
        });
      });
    });
  });
};

exports.actualizar = (id, data) => {
  const { Nombre, Tipo, N_Instancia, Fecha } = data;
  const sql = `
    UPDATE evaluacion
    SET Nombre = ?, Tipo = ?, N_Instancia = ?, Fecha = ?
    WHERE ID_Evaluacion = ?
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [Nombre, Tipo, N_Instancia, Fecha, id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
