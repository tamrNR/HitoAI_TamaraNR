const connection = require('../db/connection');

exports.crear = (data) => {
  const sql = `
    INSERT INTO inscripcion (asignatura_ID_Asignatura, estudiante_ID_Estudiante, Anio, Semestre, Estado)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [
    data.asignatura_ID_Asignatura,
    data.estudiante_ID_Estudiante,
    data.Anio,
    data.Semestre,
    data.Estado || 'Activo'
  ];
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => err ? reject(err) : resolve());
  });
};

exports.obtenerPorAsignatura = (id) => {
  const sql = `
    SELECT e.ID_Estudiante, e.Nombre, e.Apellido, i.Anio, i.ID_Inscripcion
    FROM inscripcion i
    JOIN estudiante e ON e.ID_Estudiante = i.estudiante_ID_Estudiante
    WHERE i.asignatura_ID_Asignatura = ? AND i.Estado = 'Activo'
    ORDER BY e.Apellido, e.Nombre, i.Anio
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => err ? reject(err) : resolve(results));
  });
};

exports.eliminar = (asignaturaId, estudianteId, anio) => {
  let sql = `DELETE FROM inscripcion WHERE asignatura_ID_Asignatura = ? AND estudiante_ID_Estudiante = ?`;
  const params = [asignaturaId, estudianteId];
  if (anio) {
    sql += ' AND Anio = ?';
    params.push(anio);
  }
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => err ? reject(err) : resolve());
  });
};

exports.desvincular = (asignaturaId, estudianteId, anio) => {
  let sqlObtenerInscripcion = `
    SELECT ID_Inscripcion FROM inscripcion
    WHERE asignatura_ID_Asignatura = ? AND estudiante_ID_Estudiante = ? AND Estado = 'Activo'
  `;
  const paramsObtener = [asignaturaId, estudianteId];
  if (anio) {
    sqlObtenerInscripcion += ' AND Anio = ?';
    paramsObtener.push(anio);
  }
  sqlObtenerInscripcion += ' ORDER BY ID_Inscripcion DESC LIMIT 1';

  const sqlLimpiarPlaceholders = `
    DELETE FROM aplicacion
    WHERE inscripcion_ID_Inscripcion = ? AND (Obtenido IS NULL OR Obtenido = 0)
  `;

  return new Promise((resolve, reject) => {
    connection.query(sqlObtenerInscripcion, paramsObtener, (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) return resolve(false);

      const inscripcionId = rows[0].ID_Inscripcion;

      connection.query(sqlLimpiarPlaceholders, [inscripcionId], (err2) => {
        if (err2) return reject(err2);

        const sqlDesvincular = `UPDATE inscripcion SET Estado = 'Desvinculada' WHERE ID_Inscripcion = ?`;
        connection.query(sqlDesvincular, [inscripcionId], (err3, results) => {
          if (err3) return reject(err3);
          resolve(results.affectedRows > 0);
        });
      });
    });
  });
};

exports.existe = (asignaturaId, estudianteId, anio) => {
  const sql = `
    SELECT 1 FROM inscripcion
    WHERE asignatura_ID_Asignatura = ? AND estudiante_ID_Estudiante = ? AND Anio = ? AND Estado = 'Activo'
    LIMIT 1
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [asignaturaId, estudianteId, anio], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

exports.obtenerPorEstudianteYAsignatura = (estudianteId, asignaturaId, anio) => {
  let sql = `
    SELECT ID_Inscripcion
    FROM inscripcion
    WHERE estudiante_ID_Estudiante = ? AND asignatura_ID_Asignatura = ? AND Estado = 'Activo'
  `;
  const params = [estudianteId, asignaturaId];

  if (anio) {
    sql += ' AND Anio = ?';
    params.push(anio);
  }

  sql += ' ORDER BY ID_Inscripcion DESC LIMIT 1';

  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};
