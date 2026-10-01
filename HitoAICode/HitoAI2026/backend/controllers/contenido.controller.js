const ContenidoService = require('../services/contenido.service');

// Obtener contenidos por asignatura
exports.obtenerPorAsignatura = async (req, res) => {
  const id = req.params.id;
  const data = await ContenidoService.obtenerPorAsignatura(id);
  res.json(data);
};

// Crear contenido
exports.crear = async (req, res) => {
  try {
    const { Nucleo_Tematico, Descripcion, Horas, asignatura_ID_Asignatura } = req.body;
    await ContenidoService.crear({ Nucleo_Tematico, Descripcion, Horas, asignatura_ID_Asignatura });
    res.status(201).json({ message: 'Contenido creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear contenido' });
  }
};

// Actualizar contenido
exports.actualizar = async (req, res) => {
  try {
    const { Nucleo_Tematico, Descripcion, Horas } = req.body;
    await ContenidoService.actualizar(req.params.id, { Nucleo_Tematico, Descripcion, Horas });
    res.json({ message: 'Contenido actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar contenido' });
  }
};

// Eliminar contenido
exports.eliminar = async (req, res) => {
  try {
    await ContenidoService.eliminar(req.params.id);
    res.json({ message: 'Contenido eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar contenido' });
  }
};

exports.resumenCurricular = async (req, res) => {
  try {
    const data = await ContenidoService.resumenCurricular(req.params.id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener resumen curricular' });
  }
};

exports.obtenerCompetenciasDeRA = async (req, res) => {
  try {
    const data = await ContenidoService.obtenerCompetenciasDeRA(req.params.idRA);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener competencias del RA' });
  }
};
