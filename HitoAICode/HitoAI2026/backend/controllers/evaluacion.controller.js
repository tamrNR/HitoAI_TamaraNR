const EvaluacionService = require('../services/evaluacion.service');

exports.contarPorAsignatura = async (req, res) => {
  try {
    const count = await EvaluacionService.contarPorAsignatura(req.params.idAsignatura);
    res.json(count);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al contar evaluaciones' });
  }
};

exports.crearConAplicaciones = async (req, res) => {
  try {
    const data = req.body;
    await EvaluacionService.crearConAplicaciones(data);
    res.status(201).json({ message: 'Evaluación creada con aplicaciones' });
  } catch (err) {
    console.error(err);
    const mensaje = err.message || 'Error al crear evaluación con aplicaciones';
    res.status(400).json({ message: mensaje });
  }
};


exports.obtenerPorAsignatura = async (req, res) => {
  try {
    const data = await EvaluacionService.obtenerPorAsignatura(req.params.id);
    res.json(data);
  } catch (err) {
    console.error('Error al obtener evaluaciones por asignatura:', err);
    res.status(500).json({ message: 'Error al obtener evaluaciones' });
  }
};
exports.obtenerContenidosUsados = async (req, res) => {
  try {
    const usados = await EvaluacionService.obtenerContenidosUsados(req.params.asignaturaID);
    res.json(usados);
  } catch (err) {
    console.error('Error al obtener contenidos usados:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await EvaluacionService.eliminar(req.params.id);
    res.json({ message: 'Evaluación eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar evaluación' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    await EvaluacionService.actualizar(req.params.id, req.body);
    res.json({ message: 'Evaluación actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar evaluación' });
  }
};
