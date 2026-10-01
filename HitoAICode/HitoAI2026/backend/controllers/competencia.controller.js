const CompetenciaService = require('../services/competencia.service');

// Obtener todas las competencias
exports.getAllCompetencias = async (req, res) => {
  const competencias = await CompetenciaService.getAll();
  res.json(competencias);
};

// Obtener una competencia por ID
exports.getCompetenciaById = async (req, res) => {
  const competencia = await CompetenciaService.getById(req.params.id);
  res.json(competencia);
};

// Crear una nueva competencia
exports.crearCompetencia = async (req, res) => {
  const { ID_Competencia, Nombre, Descripcion, Tipo } = req.body;
  if (await CompetenciaService.existeId(ID_Competencia)) {
    return res.status(400).json({ message: 'El ID de la competencia ya está registrado' });
  }
  if (await CompetenciaService.existeNombre(Nombre)) {
    return res.status(400).json({ message: 'El nombre de la competencia ya está registrado' });
  }

  await CompetenciaService.crear({ ID_Competencia, Nombre, Descripcion, Tipo });
  res.status(201).json({ message: 'Competencia creada con éxito' });
};

// Actualizar una competencia existente
exports.actualizarCompetencia = async (req, res) => {
  const { Nombre, Descripcion, Tipo } = req.body;
  if (await CompetenciaService.existeNombreOtro(Nombre, req.params.id)) {
    return res.status(400).json({ message: 'El nombre de la competencia ya está registrado' });
  }

  await CompetenciaService.actualizar(req.params.id, { Nombre, Descripcion, Tipo });
  res.json({ message: 'Competencia actualizada' });
};

// Eliminar una competencia
exports.eliminarCompetencia = async (req, res) => {
  const tieneRA = await CompetenciaService.tieneRA(req.params.id);
  if (tieneRA) {
    return res
      .status(400)
      .json({ message: 'La competencia está relacionada con uno o más RA' });
  }

  await CompetenciaService.eliminar(req.params.id);
  res.json({ message: 'Competencia eliminada' });
};
