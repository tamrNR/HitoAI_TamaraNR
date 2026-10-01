const connection = require('../db/connection');

// Obtener todas las competencias
exports.getAll = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM competencia', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Obtener una competencia por ID
exports.getById = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM competencia WHERE ID_Competencia = ?', [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

// Verificar si existe una competencia con el ID dado
exports.existeId = (id) => {
  const sql = 'SELECT 1 FROM competencia WHERE ID_Competencia = ? LIMIT 1';
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

// Verificar si existe una competencia con el nombre dado
exports.existeNombre = (nombre) => {
  const sql = 'SELECT 1 FROM competencia WHERE Nombre = ? LIMIT 1';
  return new Promise((resolve, reject) => {
    connection.query(sql, [nombre], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

// Verificar si existe una competencia con el nombre dado excluyendo un ID
exports.existeNombreOtro = (nombre, id) => {
  const sql = 'SELECT 1 FROM competencia WHERE Nombre = ? AND ID_Competencia <> ? LIMIT 1';
  return new Promise((resolve, reject) => {
    connection.query(sql, [nombre, id], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

// Comprobar si una competencia está vinculada a algún RA
exports.tieneRA = (id) => {
  const sql = 'SELECT 1 FROM ra_competencia WHERE competencia_ID_Competencia = ? LIMIT 1';
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

// Crear una nueva competencia
exports.crear = ({ ID_Competencia, Nombre, Descripcion, Tipo }) => {
  const sql = `
    INSERT INTO competencia (ID_Competencia, Nombre, Descripcion, Tipo)
    VALUES (?, ?, ?, ?)
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [ID_Competencia, Nombre, Descripcion, Tipo], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Actualizar una competencia existente
exports.actualizar = (id, { Nombre, Descripcion, Tipo }) => {
  const sql = `
    UPDATE competencia
    SET Nombre = ?, Descripcion = ?, Tipo = ?
    WHERE ID_Competencia = ?
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [Nombre, Descripcion, Tipo, id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

// Eliminar una competencia por ID
exports.eliminar = (id) => {
  return new Promise((resolve, reject) => {
    connection.query('DELETE FROM competencia WHERE ID_Competencia = ?', [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};
