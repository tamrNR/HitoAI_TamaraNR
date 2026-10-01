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

exports.crearConAplicaciones = (data) => {
  return new Promise((resolve, reject) => {
    const { Nombre, Tipo, N_Instancia, Fecha, asignatura_ID_Asignatura, contenidos } = data;

    if (!asignatura_ID_Asignatura) {
      return reject(new Error('Debe enviar el ID de la asignatura'));
    }

    const sqlEvaluacion = `
      INSERT INTO evaluacion (Nombre, Tipo, N_Instancia, Fecha, asignatura_ID_Asignatura)
      VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(sqlEvaluacion, [Nombre, Tipo, N_Instancia, Fecha, asignatura_ID_Asignatura], (err, result) => {
      if (err) return reject(err);
      const evaluacionID = result.insertId;

      const sqlInscripciones = `
        SELECT * FROM inscripcion
        WHERE asignatura_ID_Asignatura = ?
      `;

      connection.query(sqlInscripciones, [asignatura_ID_Asignatura], (err, inscripciones) => {
        if (err) return reject(err);
        if (inscripciones.length === 0) {
          return reject(new Error('No hay estudiantes inscritos en esta asignatura.'));
        }

        let tareasPendientes = 0;
        let falló = false;
        let totalAplicaciones = 0;

        for (const contenidoID of contenidos) {
          const sqlIndicadores = `
            SELECT * FROM indicador
            WHERE contenido_ID_Contenido = ?
          `;

          connection.query(sqlIndicadores, [contenidoID], (err, indicadores) => {
            if (err) {
              falló = true;
              return reject(err);
            }

            if (indicadores.length === 0) {
              return reject(new Error(`El contenido con ID ${contenidoID} no tiene indicadores asociados.`));
            }

            for (const insc of inscripciones) {
              for (const ind of indicadores) {
                const sqlAplicacion = `
                  INSERT INTO aplicacion (Obtenido, Grupo, inscripcion_ID_Inscripcion, evaluacion_ID_Evaluacion, indicador_ID_Indicador)
                  VALUES (0, 0, ?, ?, ?)
                `;

                tareasPendientes++;
                connection.query(sqlAplicacion, [insc.ID_Inscripcion, evaluacionID, ind.ID_Indicador], (err) => {
                  if (err && !falló) {
                    falló = true;
                    return reject(err);
                  }

                  tareasPendientes--;
                  if (tareasPendientes === 0 && !falló) {
                    resolve();
                  }
                });
              }
            }
          });
        }

        if (contenidos.length === 0) {
          return reject(new Error('Debes seleccionar al menos un contenido.'));
        }
      });
    });
  });
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
