const connection = require('../db/connection');

// Obtener todos los roles
exports.getAll = () => {
  const sql = `SELECT * FROM rol ORDER BY ID_Rol ASC`;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};
