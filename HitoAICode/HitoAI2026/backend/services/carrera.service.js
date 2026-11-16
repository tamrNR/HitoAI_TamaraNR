const connection = require('../db/connection');

exports.getAll = (scope = null) => {
  const filtros = [];
  const params = [];
  if (scope?.carreraId !== undefined && scope?.carreraId !== null) {
    filtros.push('c.ID_Carrera = ?');
    params.push(scope.carreraId);
  }
  if (scope?.facultadId !== undefined && scope?.facultadId !== null) {
    filtros.push('c.facultad_ID_Facultad = ?');
    params.push(scope.facultadId);
  }
  if (scope?.profesorId !== undefined && scope?.profesorId !== null) {
    filtros.push(`c.ID_Carrera IN (SELECT DISTINCT carrera_ID_Carrera FROM asignatura WHERE usuario_ID_Usuario = ?)`);
    params.push(scope.profesorId);
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  const sql = `
    SELECT
      c.ID_Carrera,
      c.Nombre,
      c.facultad_ID_Facultad,
      c.usuario_ID_Usuario,
      u.Nombre AS JefeCarrera,
      f.Nombre AS Facultad
    FROM carrera c
    LEFT JOIN usuario u ON c.usuario_ID_Usuario = u.ID_Usuario
    LEFT JOIN facultad f ON c.facultad_ID_Facultad = f.ID_Facultad
    ${where}
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.crear = ({ Nombre, facultad_ID_Facultad, usuario_ID_Usuario }) => {
  const sql = `INSERT INTO carrera (Nombre, facultad_ID_Facultad, usuario_ID_Usuario) VALUES (?, ?, ?)`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [Nombre, facultad_ID_Facultad, usuario_ID_Usuario], (err) =>
      err ? reject(err) : resolve()
    );
  });
};

exports.actualizar = (id, { Nombre, usuario_ID_Usuario }) => {
  const sql = `UPDATE carrera SET Nombre = ?, usuario_ID_Usuario = ? WHERE ID_Carrera = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [Nombre, usuario_ID_Usuario, id], (err) =>
      err ? reject(err) : resolve()
    );
  });
};

exports.eliminar = (id) => {
  const sql = `DELETE FROM carrera WHERE ID_Carrera = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err) => err ? reject(err) : resolve());
  });
};

exports.getEstadisticas = (idCarrera) => {
  const sqlEstudiantes = `
    SELECT COUNT(DISTINCT e.ID_Estudiante) AS total_estudiantes
    FROM asignatura a
    JOIN inscripcion i ON i.asignatura_ID_Asignatura = a.ID_Asignatura AND i.Estado = 'Activo'
    JOIN estudiante e ON e.ID_Estudiante = i.estudiante_ID_Estudiante
    WHERE a.carrera_ID_Carrera = ?
  `;

  const sqlGeneraciones = `
    SELECT DISTINCT e.Anio_Ingreso
    FROM asignatura a
    JOIN inscripcion i ON i.asignatura_ID_Asignatura = a.ID_Asignatura AND i.Estado = 'Activo'
    JOIN estudiante e ON e.ID_Estudiante = i.estudiante_ID_Estudiante
    WHERE a.carrera_ID_Carrera = ?
    ORDER BY e.Anio_Ingreso ASC
  `;

  return new Promise((resolve, reject) => {
    connection.query(sqlEstudiantes, [idCarrera], (err, resEst) => {
      if (err) return reject(err);
      connection.query(sqlGeneraciones, [idCarrera], (err2, resGen) => {
        if (err2) return reject(err2);
        resolve({
          total_estudiantes: resEst[0].total_estudiantes,
          generaciones: resGen.map(r => r.Anio_Ingreso)
        });
      });
    });
  });
};
