const connection = require('../db/connection');

exports.obtenerTodas = (scope = null) => {
  const filtros = [];
  const params = [];
  if (scope?.carreraId !== undefined && scope?.carreraId !== null) {
    filtros.push('a.carrera_ID_Carrera = ?');
    params.push(scope.carreraId);
  }
  if (scope?.facultadId !== undefined && scope?.facultadId !== null) {
    filtros.push('c.facultad_ID_Facultad = ?');
    params.push(scope.facultadId);
  }
  if (scope?.profesorId !== undefined && scope?.profesorId !== null) {
    filtros.push('a.usuario_ID_Usuario = ?');
    params.push(scope.profesorId);
  }
  const whereExtra = filtros.length ? ` AND ${filtros.join(' AND ')}` : '';
  const sql = `
    SELECT
      a.*,
      u.Nombre AS Profesor,
      c.Nombre AS Carrera,
      c.facultad_ID_Facultad AS Facultad_ID,
      f.Nombre AS Facultad
    FROM asignatura a
    JOIN usuario u ON u.ID_Usuario = a.usuario_ID_Usuario
    JOIN carrera c ON c.ID_Carrera = a.carrera_ID_Carrera
    LEFT JOIN facultad f ON f.ID_Facultad = c.facultad_ID_Facultad
    WHERE a.Estado = 'Activo'${whereExtra}
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
  });
};

exports.obtenerPorCarreraDelJefe = (idUsuario) => {
  const sql = `
    SELECT a.*, u.Nombre AS Profesor, c.Nombre AS Carrera
    FROM asignatura a
    JOIN carrera c ON a.carrera_ID_Carrera = c.ID_Carrera
    JOIN usuario u ON u.ID_Usuario = a.usuario_ID_Usuario
    WHERE c.usuario_ID_Usuario = ? AND a.Estado = 'Activo'
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [idUsuario], (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });
};





// ID de la carrera cuyo jefe es el usuario indicado
exports.obtenerCarreraIdPorJefe = (idUsuario) => {
  const sql = `SELECT ID_Carrera FROM carrera WHERE usuario_ID_Usuario = ? LIMIT 1`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [idUsuario], (err, results) =>
      err ? reject(err) : resolve(results[0]?.ID_Carrera ?? null)
    );
  });
};

exports.obtenerPorProfesor = (rutProfesor) => {
  const sql = `
    SELECT a.*, c.Nombre AS Carrera
    FROM asignatura a
    JOIN carrera c ON a.carrera_ID_Carrera = c.ID_Carrera
    WHERE a.usuario_ID_Usuario = ? AND a.Estado = 'Activo'
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [rutProfesor], (err, results) => (err ? reject(err) : resolve(results)));
  });
};

exports.crear = (data) => {
  const sql = `
    INSERT INTO asignatura (
      ID_Asignatura,
      Nombre,
      Semestre,
      N_Hito,
      Plan_Academico,
      carrera_ID_Carrera,
      usuario_ID_Usuario,
      Estado,
      Umbral
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    data.ID_Asignatura,
    data.Nombre,
    data.Semestre,
    data.N_Hito,
    data.Plan_Academico,
    data.carrera_ID_Carrera,
    data.usuario_ID_Usuario,
    data.Estado || 'Activo',
    data.Umbral
  ];
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => (err ? reject(err) : resolve()));
  });
};

exports.actualizar = (id, data) => {
  const sql = `
    UPDATE asignatura
    SET Nombre = ?, Semestre = ?, N_Hito = ?, Plan_Academico = ?, carrera_ID_Carrera = ?, usuario_ID_Usuario = ?
    WHERE ID_Asignatura = ?
  `;
  const params = [
    data.Nombre,
    data.Semestre,
    data.N_Hito,
    data.Plan_Academico,
    data.carrera_ID_Carrera,
    data.usuario_ID_Usuario,
    id
  ];
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => (err ? reject(err) : resolve()));
  });
};

exports.actualizarUmbral = (id, umbral) => {
  const sql = `UPDATE asignatura SET Umbral = ? WHERE ID_Asignatura = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [umbral, id], (err) => (err ? reject(err) : resolve()));
  });
};

exports.obtenerUmbral = (id) => {
  const sql = `SELECT Umbral FROM asignatura WHERE ID_Asignatura = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]?.Umbral ?? null);
    });
  });
};

exports.eliminar = (id) => {
  const sqlAsignatura =
    "UPDATE asignatura SET Estado = 'Inactivo' WHERE ID_Asignatura = ?";
  const sqlInscripciones =
    "UPDATE inscripcion SET Estado = 'Inactivo' WHERE asignatura_ID_Asignatura = ?";
  return new Promise((resolve, reject) => {
    connection.query(sqlAsignatura, [id], (err) => {
      if (err) return reject(err);
      connection.query(sqlInscripciones, [id], (err2) =>
        err2 ? reject(err2) : resolve()
      );
    });
  });
};
