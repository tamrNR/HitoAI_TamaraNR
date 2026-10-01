const connection = require('../db/connection');
exports.getAll = () => {
  const sql = 'SELECT ID_Facultad, Nombre FROM facultad ORDER BY Nombre';
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });
};
