const RaService = require('../services/ra.service');

exports.getAllRA = async (req, res) => {
  const ra = await RaService.getAll();
  res.json(ra);
};

exports.getRAById = async (req, res) => {
  const ra = await RaService.getById(req.params.id);
  res.json(ra);
};

exports.crearRA = async (req, res) => {
  const { Nombre, Descripcion, asignatura_ID_Asignatura, competencias } = req.body;

  if (!Nombre || !Descripcion || !asignatura_ID_Asignatura || !Array.isArray(competencias) || competencias.length === 0) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    await RaService.crearRAConCompetencias(
      { Nombre, Descripcion, asignatura_ID_Asignatura },
      competencias
    );
    res.status(201).json({ message: 'Resultado de Aprendizaje creado con éxito' });
  } catch (error) {
    console.error('Error al crear RA:', error);
    res.status(500).json({ message: 'Error al crear RA', error: error.message });
  }
};

exports.actualizarRA = async (req, res) => {
  const { Nombre, Descripcion, asignatura_ID_Asignatura, competencias } = req.body;
  const ID_RA = req.params.id;

  if (!Nombre || !Descripcion || !asignatura_ID_Asignatura || !Array.isArray(competencias) || competencias.length === 0) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  try {
    await RaService.actualizarRAConCompetencias(
      ID_RA,
      { Nombre, Descripcion, asignatura_ID_Asignatura },
      competencias
    );
    res.json({ message: 'Resultado de Aprendizaje actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar RA:', error);
    res.status(500).json({ message: 'Error al actualizar RA', error: error.message });
  }
};

exports.eliminarRA = async (req, res) => {
  try {
    const id = req.params.id;
    const tieneIndicadores = await RaService.tieneIndicadores(id);
    if (tieneIndicadores) {
      return res.status(400).json({
        message:
          'No se puede eliminar el resultado de aprendizaje porque tiene indicadores relacionados',
      });
    }
    await RaService.eliminar(id);
    res.json({ message: 'Resultado de Aprendizaje eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar RA', error: error.message });
  }
};
exports.getRAByAsignatura = async (req, res) => {
  try {
    const resultados = await RaService.getByAsignatura(req.params.id);
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener RA por asignatura', error: error.message });
  }
};
exports.getRAByContenido = async (req, res) => {
  try {
    const contenido = await RaService.getAsignaturaByContenido(req.params.idContenido);
    const resultados = await RaService.getByAsignatura(contenido.asignatura_ID_Asignatura);
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener RA por contenido', error: error.message });
  }
};

exports.actualizarCompetencias = async (req, res) => {
  const { competencias } = req.body;
  const idRA = req.params.id;
  if (!Array.isArray(competencias)) {
    return res.status(400).json({ message: 'competencias debe ser un array' });
  }
  try {
    await RaService.actualizarCompetencias(idRA, competencias);
    res.json({ message: 'Competencias actualizadas correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar competencias' });
  }
};
