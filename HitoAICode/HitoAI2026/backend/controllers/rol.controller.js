const RolService = require('../services/rol.service');

// Obtener todos los roles
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await RolService.getAll();
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
};
