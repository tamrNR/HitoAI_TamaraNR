const connection = require('../db/connection');

// Obtener todos los RA
exports.getAll = () => {
  const sql = `
    SELECT 
      ra.ID_RA, 
      ra.Nombre,
      ra.Descripcion,
      ra.asignatura_ID_Asignatura,
      GROUP_CONCAT(rc.competencia_ID_Competencia ORDER BY rc.competencia_ID_Competencia SEPARATOR ' + ') AS competencias
    FROM ra
    LEFT JOIN ra_competencia rc ON ra.ID_RA = rc.ra_ID_RA
    GROUP BY ra.ID_RA, ra.Nombre, ra.Descripcion, ra.asignatura_ID_Asignatura
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => (err ? reject(err) : resolve(results)));
  });
};

// Obtener RA por ID
exports.getById = (id) => {
  const sql = `
    SELECT 
      ra.ID_RA, 
      ra.Nombre,
      ra.Descripcion,
      ra.asignatura_ID_Asignatura,
      GROUP_CONCAT(rc.competencia_ID_Competencia ORDER BY rc.competencia_ID_Competencia SEPARATOR ' + ') AS competencias
    FROM ra
    LEFT JOIN ra_competencia rc ON ra.ID_RA = rc.ra_ID_RA
    WHERE ra.ID_RA = ?
    GROUP BY ra.ID_RA, ra.Nombre, ra.Descripcion, ra.asignatura_ID_Asignatura
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

// Crear RA sin enviar ID_RA
exports.crearRAConCompetencias = async (ra, competencias) => {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) return reject(err);

      const insertRA = `
        INSERT INTO ra (Nombre, Descripcion, asignatura_ID_Asignatura)
        VALUES (?, ?, ?)
      `;
      const paramsRA = [
        ra.Nombre,
        ra.Descripcion,
        ra.asignatura_ID_Asignatura
      ];

      connection.query(insertRA, paramsRA, (err, result) => {
        if (err) return connection.rollback(() => reject(err));

        const nuevoId = result.insertId;

        const insertRelacion = `
          INSERT INTO ra_competencia (ra_ID_RA, competencia_ID_Competencia)
          VALUES ?
        `;
        const values = competencias.map(c => [nuevoId, c]);

        connection.query(insertRelacion, [values], (err) => {
          if (err) return connection.rollback(() => reject(err));
          connection.commit(err => {
            if (err) return connection.rollback(() => reject(err));
            resolve();
          });
        });
      });
    });
  });
};

// Actualizar RA y competencias
exports.actualizarRAConCompetencias = async (id, ra, competencias) => {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) return reject(err);

      const updateRA = `
        UPDATE ra
        SET Nombre = ?, Descripcion = ?, asignatura_ID_Asignatura = ?
        WHERE ID_RA = ?
      `;
      const params = [
        ra.Nombre,
        ra.Descripcion,
        ra.asignatura_ID_Asignatura,
        id
      ];

      connection.query(updateRA, params, (err) => {
        if (err) return connection.rollback(() => reject(err));

        const deleteAntiguas = `DELETE FROM ra_competencia WHERE ra_ID_RA = ?`;
        connection.query(deleteAntiguas, [id], (err) => {
          if (err) return connection.rollback(() => reject(err));

          const insertRelacion = `
            INSERT INTO ra_competencia (ra_ID_RA, competencia_ID_Competencia)
            VALUES ?
          `;
          const values = competencias.map(c => [id, c]);

          connection.query(insertRelacion, [values], (err) => {
            if (err) return connection.rollback(() => reject(err));
            connection.commit(err => {
              if (err) return connection.rollback(() => reject(err));
              resolve();
            });
          });
        });
      });
    });
  });
};

// Eliminar RA
exports.eliminar = (id) => {
  const eliminarVinculos = `DELETE FROM ra_competencia WHERE ra_ID_RA = ?`;
  const eliminarRA = `DELETE FROM ra WHERE ID_RA = ?`;

  return new Promise((resolve, reject) => {
    connection.query(eliminarVinculos, [id], (err) => {
      if (err) return reject(err);
      connection.query(eliminarRA, [id], (err2) => {
        if (err2) return reject(err2);
        resolve();
      });
    });
  });
};

// Comprobar si el RA tiene indicadores asociados
exports.tieneIndicadores = (id) => {
  const sql = 'SELECT COUNT(*) AS count FROM indicador WHERE ra_ID_RA = ?';
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].count > 0);
    });
  });
};
exports.getByAsignatura = (asignaturaId) => {
  const sql = `
    SELECT 
      ra.ID_RA, 
      ra.Nombre,
      ra.Descripcion,
      ra.asignatura_ID_Asignatura,
      GROUP_CONCAT(rc.competencia_ID_Competencia ORDER BY rc.competencia_ID_Competencia SEPARATOR ' + ') AS competencias
    FROM ra
    LEFT JOIN ra_competencia rc ON ra.ID_RA = rc.ra_ID_RA
    WHERE ra.asignatura_ID_Asignatura = ?
    GROUP BY ra.ID_RA, ra.Nombre, ra.Descripcion, ra.asignatura_ID_Asignatura
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [asignaturaId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
exports.getAsignaturaByContenido = (idContenido) => {
  const sql = 'SELECT asignatura_ID_Asignatura FROM contenido WHERE ID_Contenido = ?';
  return new Promise((resolve, reject) => {
    connection.query(sql, [idContenido], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return reject(new Error('Contenido no encontrado'));
      resolve(results[0]);
    });
  });
};

exports.actualizarCompetencias = (idRA, competencias) => {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) return reject(err);

      const borrar = `DELETE FROM ra_competencia WHERE ra_ID_RA = ?`;
      connection.query(borrar, [idRA], (err) => {
        if (err) return connection.rollback(() => reject(err));

        if (competencias.length === 0) {
          return connection.commit(err =>
            err ? connection.rollback(() => reject(err)) : resolve()
          );
        }

        const insertar = `
          INSERT INTO ra_competencia (ra_ID_RA, competencia_ID_Competencia) VALUES ?
        `;
        const values = competencias.map(c => [idRA, c]);
        connection.query(insertar, [values], (err) => {
          if (err) return connection.rollback(() => reject(err));
          connection.commit(err =>
            err ? connection.rollback(() => reject(err)) : resolve()
          );
        });
      });
    });
  });
};
