const connection = require('../db/connection');

// Obtener todos los contenidos de una asignatura
exports.obtenerPorAsignatura = (idAsignatura) => {
  const sql = `
    SELECT * FROM contenido
    WHERE asignatura_ID_Asignatura = ?
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [idAsignatura], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Crear nuevo contenido
exports.crear = (data) => {
  const sql = `
    INSERT INTO contenido (Nucleo_Tematico, Descripcion, Horas, asignatura_ID_Asignatura)
    VALUES (?, ?, ?, ?)
  `;
  const params = [data.Nucleo_Tematico, data.Descripcion, data.Horas, data.asignatura_ID_Asignatura];
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Actualizar contenido existente
exports.actualizar = (id, data) => {
  const sql = `
    UPDATE contenido
    SET Nucleo_Tematico = ?, Descripcion = ?, Horas = ?
    WHERE ID_Contenido = ?
  `;
  const params = [data.Nucleo_Tematico, data.Descripcion, data.Horas, id];
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Eliminar contenido por ID
exports.eliminar = (id) => {
  const sql = `DELETE FROM contenido WHERE ID_Contenido = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

exports.resumenCurricular = (idAsignatura) => {
  const sql = `
    SELECT
      COUNT(DISTINCT c.ID_Contenido) AS total_contenidos,
      COALESCE(SUM(c.Horas), 0) AS total_horas,
      COUNT(DISTINCT r.ID_RA) AS total_ra,
      COUNT(DISTINCT rc.competencia_ID_Competencia) AS total_competencias
    FROM asignatura a
    LEFT JOIN contenido c ON c.asignatura_ID_Asignatura = a.ID_Asignatura
    LEFT JOIN ra r ON r.asignatura_ID_Asignatura = a.ID_Asignatura
    LEFT JOIN ra_competencia rc ON rc.ra_ID_RA = r.ID_RA
    WHERE a.ID_Asignatura = ?
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [idAsignatura], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

exports.obtenerCompetenciasDeRA = (idRA) => {
  const sqlTodas = `SELECT ID_Competencia, Nombre, Tipo FROM competencia ORDER BY ID_Competencia`;
  const sqlVinculadas = `SELECT competencia_ID_Competencia FROM ra_competencia WHERE ra_ID_RA = ?`;

  return new Promise((resolve, reject) => {
    connection.query(sqlTodas, [], (err, todas) => {
      if (err) return reject(err);
      connection.query(sqlVinculadas, [idRA], (err2, vinculadas) => {
        if (err2) return reject(err2);
        const ids = new Set(vinculadas.map(v => v.competencia_ID_Competencia));
        const resultado = todas.map(c => ({
          ...c,
          vinculada: ids.has(c.ID_Competencia)
        }));
        resolve(resultado);
      });
    });
  });
};
