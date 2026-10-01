const AsignaturaService = require('../services/asignatura.service');
const { validateLengths } = require('../utils/validateLengths');

exports.obtenerTodas = async (req, res) => {
  const data = await AsignaturaService.obtenerTodas();
  res.json(data);
};

exports.obtenerPorCarreraDelJefe = async (req, res) => {
  const rutJefe = req.params.rut;
  try {
    const data = await AsignaturaService.obtenerPorCarreraDelJefe(rutJefe);
    res.json(data);
  } catch (error) {
    console.error('Error al obtener asignaturas del jefe:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtenerPorProfesor = async (req, res) => {
  const rut = req.params.rut;
  try {
    const data = await AsignaturaService.obtenerPorProfesor(rut);
    res.json(data);
  } catch (error) {
    console.error('Error al obtener asignaturas del profesor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.crear = async (req, res) => {
  const { ID_Asignatura, Nombre, usuario_ID_Usuario } = req.body;
  const err = validateLengths(
    { ID_Asignatura, Nombre, usuario_ID_Usuario },
    { ID_Asignatura: 10, Nombre: 100, usuario_ID_Usuario: 10 }
  );
  if (err) return res.status(400).json({ message: err });

  try {
    await AsignaturaService.crear(req.body);
    res.status(201).json({ message: 'Asignatura creada' });
  } catch (error) {
    console.error('Error al crear asignatura:', error);
    res.status(500).json({ message: 'Error al crear asignatura' });
  }
};

exports.actualizar = async (req, res) => {
  const id = req.params.id;
  const { ID_Asignatura, Nombre, usuario_ID_Usuario } = req.body;
  const err = validateLengths(
    { ID_Asignatura, Nombre, usuario_ID_Usuario },
    { ID_Asignatura: 10, Nombre: 100, usuario_ID_Usuario: 10 }
  );
  if (err) return res.status(400).json({ message: err });

  try {
    await AsignaturaService.actualizar(id, req.body);
    res.json({ message: 'Asignatura actualizada' });
  } catch (error) {
    console.error('Error al actualizar asignatura:', error);
    res.status(500).json({ message: 'Error al actualizar asignatura' });
  }
};

exports.eliminar = async (req, res) => {
  const id = req.params.id;
  try {
    await AsignaturaService.eliminar(id);
    res.json({ message: 'Asignatura eliminada' });
  } catch (error) {
    console.error('Error al eliminar asignatura:', error);
    res.status(500).json({ message: 'Error al eliminar asignatura' });
  }
};

exports.actualizarUmbral = async (req, res) => {
  const id = req.params.id;
  const { Umbral } = req.body;

  if (Umbral === undefined || Umbral === null || Umbral === '') {
    return res.status(400).json({ message: 'El umbral es obligatorio' });
  }
  const umbralNum = Number(Umbral);
  if (Number.isNaN(umbralNum) || umbralNum < 0 || umbralNum > 100) {
    return res.status(400).json({ message: 'El umbral debe ser un número entre 0 y 100' });
  }

  try {
    await AsignaturaService.actualizarUmbral(id, umbralNum);
    res.json({ message: 'Umbral actualizado' });
  } catch (error) {
    console.error('Error al actualizar umbral:', error);
    res.status(500).json({ message: 'Error al actualizar umbral' });
  }
};

exports.obtenerUmbral = async (req, res) => {
  const id = req.params.id;
  try {
    const umbral = await AsignaturaService.obtenerUmbral(id);
    res.json({ Umbral: umbral });
  } catch (error) {
    console.error('Error al obtener umbral:', error);
    res.status(500).json({ message: 'Error al obtener umbral' });
  }
};
