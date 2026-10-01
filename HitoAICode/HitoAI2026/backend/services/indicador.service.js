const connection = require('../db/connection');

exports.obtenerPorContenido = (contenidoID) => {
  const sqlIndicadores = `
    SELECT * FROM indicador WHERE contenido_ID_Contenido = ?
  `;
  return new Promise((resolve, reject) => {
    connection.query(sqlIndicadores, [contenidoID], async (err, indicadores) => {
      if (err) return reject(err);

      for (const indicador of indicadores) {
        const criterios = await this.obtenerCriterios(indicador.ID_Indicador);
        indicador.Criterios = criterios;
      }

      resolve(indicadores);
    });
  });
};

exports.obtenerCriterios = (indicadorID) => {
  const sql = `SELECT * FROM criterio WHERE indicador_ID_Indicador = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [indicadorID], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.crear = (indicador) => {
  const sql = `
    INSERT INTO indicador (Descripcion, Puntaje_Max, contenido_ID_Contenido, ra_ID_RA)
    VALUES (?, ?, ?, ?)
  `;
  const params = [
    indicador.Descripcion,
    indicador.Puntaje_Max,
    indicador.contenido_ID_Contenido,
    indicador.ra_ID_RA || null
  ];

  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, result) => {
      if (err) return reject(err);
      const id = result.insertId;
      const criterios = indicador.Criterios || [];

      Promise.all(
        criterios.map(c =>
          this.crearCriterio(id, c)
        )
      ).then(() => resolve()).catch(reject);
    });
  });
};

exports.crearCriterio = (indicadorID, criterio) => {
  const sql = `
    INSERT INTO criterio (Nombre, R_Min, R_Max, indicador_ID_Indicador)
    VALUES (?, ?, ?, ?)
  `;
  const params = [
    criterio.Nombre,
    criterio.R_Min,
    criterio.R_Max,
    indicadorID
  ];

  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => err ? reject(err) : resolve());
  });
};

exports.actualizar = (id, indicador) => {
  const sql = `
    UPDATE indicador
    SET Descripcion = ?, Puntaje_Max = ?, ra_ID_RA = ?
    WHERE ID_Indicador = ?
  `;
  const params = [
    indicador.Descripcion,
    indicador.Puntaje_Max,
    indicador.ra_ID_RA || null,
    id
  ];

  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => {
      if (err) return reject(err);

      // borrar criterios anteriores
      const borrar = `DELETE FROM criterio WHERE indicador_ID_Indicador = ?`;
      connection.query(borrar, [id], async (err) => {
        if (err) return reject(err);

        const criterios = indicador.Criterios || [];
        try {
          await Promise.all(
            criterios.map(c => this.crearCriterio(id, c))
          );
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
};

exports.eliminar = (id) => {
  const borrarAplicaciones = `DELETE FROM aplicacion WHERE indicador_ID_Indicador = ?`;
  const borrarCriterios = `DELETE FROM criterio WHERE indicador_ID_Indicador = ?`;
  const borrarIndicador = `DELETE FROM indicador WHERE ID_Indicador = ?`;

  return new Promise((resolve, reject) => {
    // Primero eliminar las aplicaciones para evitar errores de clave foránea
    connection.query(borrarAplicaciones, [id], (err) => {
      if (err) return reject(err);
      // Luego eliminar los criterios asociados
      connection.query(borrarCriterios, [id], (err2) => {
        if (err2) return reject(err2);
        // Finalmente eliminar el indicador
        connection.query(borrarIndicador, [id], (err3) => {
          if (err3) return reject(err3);
          resolve();
        });
      });
    });
  });
};

exports.obtenerCriteriosPorIndicador = (indicadorID) => {
  const sql = `SELECT * FROM criterio WHERE indicador_ID_Indicador = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [indicadorID], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
