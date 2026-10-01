const connection = require('../db/connection');
const bcrypt = require('bcryptjs');

// Crear nuevo usuario
exports.crearUsuario = async (ID_Usuario, Nombre, Clave, Rol_ID_Rol) => {
  const hashedClave = await bcrypt.hash(Clave, 10);
  const sql = `INSERT INTO usuario (ID_Usuario, Nombre, Clave, Rol_ID_Rol) VALUES (?, ?, ?, ?)`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [ID_Usuario, Nombre, hashedClave, Rol_ID_Rol], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Validar login y retornar detalle de errores
exports.validarLogin = (rut, clave) => {
  const sql = `
    SELECT u.ID_Usuario, u.Nombre, u.Clave, r.Nombre AS Rol
    FROM usuario u
    JOIN rol r ON u.Rol_ID_Rol = r.ID_Rol
    WHERE u.ID_Usuario = ?
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [rut], async (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve({ error: 'not_found' });

      const usuario = results[0];
      const match = await bcrypt.compare(clave, usuario.Clave);
      if (!match) return resolve({ error: 'invalid_password' });

      resolve({
        ID_Usuario: usuario.ID_Usuario,
        Nombre: usuario.Nombre,
        Rol: usuario.Rol
      });
    });
  });
};

// Obtener todos los jefes de carrera
exports.getJefesCarrera = () => {
  const sql = `
    SELECT u.ID_Usuario, u.Nombre
    FROM usuario u
    JOIN rol r ON u.Rol_ID_Rol = r.ID_Rol
    WHERE r.Nombre = 'Jefe de Carrera'
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Obtener todos los profesores
exports.getProfesores = () => {
  const sql = `
    SELECT u.ID_Usuario, u.Nombre
    FROM usuario u
    JOIN rol r ON u.Rol_ID_Rol = r.ID_Rol
    WHERE r.Nombre = 'Profesor'
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Obtener todos los usuarios con su rol
exports.getTodos = () => {
  const sql = `
    SELECT u.ID_Usuario, u.Nombre, r.Nombre AS Rol
    FROM usuario u
    JOIN rol r ON u.Rol_ID_Rol = r.ID_Rol
    ORDER BY r.Nombre, u.Nombre
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Actualizar la clave de un usuario
exports.actualizarClave = async (id, nuevaClave) => {
  const hashed = await bcrypt.hash(nuevaClave, 10);
  const sql = `UPDATE usuario SET Clave = ? WHERE ID_Usuario = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [hashed, id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Actualizar el rol de un usuario
exports.actualizarRol = (id, rolId) => {
  const sql = `UPDATE usuario SET Rol_ID_Rol = ? WHERE ID_Usuario = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [rolId, id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Verificar si un usuario existe por su ID
exports.existe = (id) => {
  const sql = `SELECT 1 FROM usuario WHERE ID_Usuario = ? LIMIT 1`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

// Eliminar un usuario
exports.eliminar = (id) => {
  const sql = `DELETE FROM usuario WHERE ID_Usuario = ?`;
  return new Promise((resolve, reject) => {
    connection.query(sql, [id], (err) => (err ? reject(err) : resolve()));
  });
};
