const AplicacionService = require('../services/aplicacion.service');

// Trae los indicadores de una evaluación + asignatura
exports.obtenerIndicadoresPorEvaluacion = async (req, res) => {
  const { evaluacionID, asignaturaID } = req.params;

  try {
    const data = await AplicacionService.obtenerIndicadoresPorEvaluacion(evaluacionID, asignaturaID);
    res.json(data);
  } catch (err) {
    console.error('Error al obtener indicadores de evaluación:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualiza los puntajes de un grupo
exports.actualizarPuntajesGrupo = async (req, res) => {
  try {
    await AplicacionService.actualizarPuntajesGrupo(req.body);
    res.json({ message: 'Puntajes actualizados correctamente' });
  } catch (err) {
    console.error('Error al actualizar puntajes:', err);
    res.status(500).json({ message: 'Error al actualizar puntajes' });
  }
};

// Lista estudiantes evaluados con puntaje > 0
exports.obtenerEstudiantesAplicados = async (req, res) => {
  const { evaluacionID, asignaturaID } = req.params;
  try {
    const data = await AplicacionService.obtenerEstudiantesAplicados(evaluacionID, asignaturaID);
    res.json(data);
  } catch (err) {
    console.error('Error al obtener estudiantes aplicados:', err);
    res.status(500).json({ message: 'Error interno al consultar aplicaciones' });
  }
};

// Trae todas las aplicaciones evaluadas con puntaje
exports.obtenerAplicacionesEvaluadas = async (req, res) => {
  const { evaluacionID, asignaturaID } = req.params;
  try {
    const data = await AplicacionService.obtenerAplicacionesEvaluadas(evaluacionID, asignaturaID);
    res.json(data);
  } catch (err) {
    console.error('Error al obtener aplicaciones evaluadas:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Trae puntajes por estudiante para modo edición
exports.obtenerPuntajesEstudiante = async (req, res) => {
  const { evaluacionID, asignaturaID, estudianteID } = req.params;
  try {
    const data = await AplicacionService.obtenerPuntajesEstudiante(
      evaluacionID,
      asignaturaID,
      estudianteID
    );
    res.json(data);
  } catch (err) {
    console.error('Error al obtener puntajes del estudiante:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// 🔹 NUEVO: Obtener todos los grupos únicos por evaluación
exports.obtenerGruposPorEvaluacion = async (req, res) => {
  const { evaluacionID, asignaturaID } = req.params;
  try {
    const grupos = await AplicacionService.obtenerGruposPorEvaluacion(evaluacionID, asignaturaID);
    res.json(grupos);
  } catch (err) {
    console.error('Error al obtener grupos:', err);
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

// 🔹 NUEVO: Asignar grupo a un conjunto de estudiantes
exports.asignarGrupoAGrupo = async (req, res) => {
  const { grupo, grupoNumero } = req.body;
  try {
    await AplicacionService.asignarGrupoAGrupo(grupo, grupoNumero);
    res.json({ message: 'Grupo asignado correctamente' });
  } catch (err) {
    console.error('Error al asignar grupo:', err);
    res.status(500).json({ message: 'Error al asignar grupo' });
  }
};
// ✅ NUEVO: obtener todos los grupos, incluso si aún no tienen puntaje
exports.obtenerAplicacionesAgrupadas = async (req, res) => {
  const { evaluacionID, asignaturaID } = req.params;
  try {
    const data = await AplicacionService.obtenerAplicacionesAgrupadas(evaluacionID, asignaturaID);
    res.json(data);
  } catch (err) {
    console.error('Error al obtener grupos completos:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
exports.disolverGrupo = async (req, res) => {
  const { grupo, evaluacionID, asignaturaID } = req.body;

  try {
    const sql = `
      UPDATE aplicacion a
      JOIN inscripcion i ON a.inscripcion_ID_Inscripcion = i.ID_Inscripcion
      SET a.Grupo = 0
      WHERE a.Grupo = ? AND a.evaluacion_ID_Evaluacion = ? AND i.asignatura_ID_Asignatura = ?
    `;

    const connection = require('../db/connection');
    connection.query(sql, [grupo, evaluacionID, asignaturaID], (err) => {
      if (err) return res.status(500).json({ message: 'Error al disolver el grupo' });
      res.json({ message: 'Grupo disuelto' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Error inesperado' });
  }
};
