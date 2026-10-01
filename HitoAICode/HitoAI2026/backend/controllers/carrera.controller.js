const CarreraService = require('../services/carrera.service');
const { validateLengths } = require('../utils/validateLengths');

exports.getAllCarreras = async (req, res) => {
  const carreras = await CarreraService.getAll();
  res.json(carreras);
};

exports.crearCarrera = async (req, res) => {
  const { Nombre, usuario_ID_Usuario } = req.body;
  const err = validateLengths({ Nombre, usuario_ID_Usuario }, {
    Nombre: 100,
    usuario_ID_Usuario: 10
  });
  if (err) return res.status(400).json({ message: err });

  await CarreraService.crear({ Nombre, facultad_ID_Facultad: 1, usuario_ID_Usuario });
  res.status(201).json({ message: 'Carrera creada con éxito' });
};

exports.actualizarCarrera = async (req, res) => {
  const { Nombre, usuario_ID_Usuario } = req.body;
  const err = validateLengths({ Nombre, usuario_ID_Usuario }, {
    Nombre: 100,
    usuario_ID_Usuario: 10
  });
  if (err) return res.status(400).json({ message: err });

  await CarreraService.actualizar(req.params.id, { Nombre, usuario_ID_Usuario });
  res.json({ message: 'Carrera actualizada' });
};

exports.eliminarCarrera = async (req, res) => {
  try {
    await CarreraService.eliminar(req.params.id);
    res.json({ message: 'Carrera eliminada' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ message: 'No se puede eliminar la carrera: tiene asignaturas vinculadas.' });
    }
    res.status(500).json({ message: 'Error al eliminar carrera' });
  }
};

exports.getEstadisticas = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await CarreraService.getEstadisticas(id);
    res.json(data);
  } catch (err) {
    console.error('Error al obtener estadísticas de carrera:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
