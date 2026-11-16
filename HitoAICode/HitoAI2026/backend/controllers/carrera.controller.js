const CarreraService = require('../services/carrera.service');
const FacultadService = require('../services/facultad.service');
const { validateLengths } = require('../utils/validateLengths');
const { scopeDesdeUsuario } = require('../middleware/auth.middleware');

exports.getAllCarreras = async (req, res) => {
  try {
    const carreras = await CarreraService.getAll(scopeDesdeUsuario(req.user));
    res.json(carreras);
  } catch (error) {
    console.error('Error al obtener carreras:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const parseFacultad = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n <= 0 ? 'invalido' : n;
};

exports.crearCarrera = async (req, res) => {
  const { Nombre, usuario_ID_Usuario, facultad_ID_Facultad } = req.body;
  const err = validateLengths({ Nombre, usuario_ID_Usuario }, {
    Nombre: 100,
    usuario_ID_Usuario: 10
  });
  if (err) return res.status(400).json({ message: err });

  const facultadId = parseFacultad(facultad_ID_Facultad);
  if (facultadId === 'invalido') {
    return res.status(400).json({ message: 'facultad_ID_Facultad inválida' });
  }
  if (facultadId === null) {
    return res.status(400).json({ message: 'La facultad es obligatoria' });
  }
  try {
    const existe = await FacultadService.existeFacultad(facultadId);
    if (!existe) {
      return res.status(400).json({ message: 'La facultad indicada no existe' });
    }
    await CarreraService.crear({ Nombre, facultad_ID_Facultad: facultadId, usuario_ID_Usuario });
    res.status(201).json({ message: 'Carrera creada con éxito' });
  } catch (e) {
    console.error('Error al crear carrera:', e);
    res.status(500).json({ message: 'Error al crear carrera' });
  }
};

exports.actualizarCarrera = async (req, res) => {
  const { Nombre, usuario_ID_Usuario, facultad_ID_Facultad } = req.body;
  const err = validateLengths({ Nombre, usuario_ID_Usuario }, {
    Nombre: 100,
    usuario_ID_Usuario: 10
  });
  if (err) return res.status(400).json({ message: err });

  const facultadId = parseFacultad(facultad_ID_Facultad);
  if (facultadId === 'invalido') {
    return res.status(400).json({ message: 'facultad_ID_Facultad inválida' });
  }
  if (facultadId === null) {
    return res.status(400).json({ message: 'La facultad es obligatoria' });
  }
  try {
    const existe = await FacultadService.existeFacultad(facultadId);
    if (!existe) {
      return res.status(400).json({ message: 'La facultad indicada no existe' });
    }
    await CarreraService.actualizar(req.params.id, { Nombre, facultad_ID_Facultad: facultadId, usuario_ID_Usuario });
    res.json({ message: 'Carrera actualizada' });
  } catch (e) {
    console.error('Error al actualizar carrera:', e);
    res.status(500).json({ message: 'Error al actualizar carrera' });
  }
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
