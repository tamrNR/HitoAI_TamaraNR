const FacultadService = require('../services/facultad.service');
exports.getAll = async (req, res) => {
  try {
    const data = await FacultadService.getAll();
    res.json(data);
  } catch (err) {
    console.error('Error al obtener facultades:', err);
    res.status(500).json({ message: 'Error al obtener facultades' });
  }
};
