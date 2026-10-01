const connection = require('../db/connection');

exports.getAll = () => {
  const sql = `SELECT * FROM estudiante`;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => err ? reject(err) : resolve(results));
  });
};

exports.getNoInscritos = () => {
  const sql = `
    SELECT * FROM estudiante e
    WHERE NOT EXISTS (
      SELECT 1 FROM inscripcion i WHERE i.estudiante_ID_Estudiante = e.ID_Estudiante
    )
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => err ? reject(err) : resolve(results));
  });
};

exports.getDisponiblesPorAsignatura = (asignaturaId, anio) => {
  let sql = `
    SELECT * FROM estudiante e
    WHERE NOT EXISTS (
      SELECT 1 FROM inscripcion i
      WHERE i.estudiante_ID_Estudiante = e.ID_Estudiante
        AND i.asignatura_ID_Asignatura = ?
        AND i.Estado = 'Activo'
  `;
  const params = [asignaturaId];

  if (anio) {
    sql += ' AND i.Anio = ?';
    params.push(anio);
  }

  sql += `
    )
  `;

  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      console.log(`[EstudianteService] Estudiantes disponibles para asignatura ${asignaturaId}${anio ? ' año ' + anio : ''}:`, results.length);
      resolve(results);
    });
  });
};

exports.crear = (est) => {
  const sql = `INSERT INTO estudiante (ID_Estudiante, Nombre, Apellido, Anio_Ingreso) VALUES (?, ?, ?, ?)`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [est.ID_Estudiante, est.Nombre, est.Apellido, est.Anio_Ingreso], (err) =>
      err ? reject(err) : resolve()
    );
  });
};

exports.actualizar = (id, est) => {
  const sql = `UPDATE estudiante SET Nombre = ?, Apellido = ?, Anio_Ingreso = ? WHERE ID_Estudiante = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [est.Nombre, est.Apellido, est.Anio_Ingreso, id], (err) =>
      err ? reject(err) : resolve()
    );
  });
};
exports.existe = (id) => {
  const sql = `SELECT 1 FROM estudiante WHERE ID_Estudiante = ? LIMIT 1`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

exports.eliminar = (id) => {
  const sql = `DELETE FROM estudiante WHERE ID_Estudiante = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err) => (err ? reject(err) : resolve()));
  });
};

exports.insertarMasivo = (estudiantes) => {
  const sql = `INSERT INTO estudiante (ID_Estudiante, Nombre, Apellido, Anio_Ingreso) VALUES ?`;
  const values = estudiantes.map(e => [e.ID_Estudiante, e.Nombre, e.Apellido, e.Anio_Ingreso]);

  return new Promise((resolve, reject) => {
    connection.query(sql, [values], (err) => err ? reject(err) : resolve());
  });
};
