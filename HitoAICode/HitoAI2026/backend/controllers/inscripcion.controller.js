const InscripcionService = require('../services/inscripcion.service');
const EvaluacionService = require('../services/evaluacion.service');
const AplicacionService = require('../services/aplicacion.service');

exports.crearMasivo = async (req, res) => {
  const { inscripciones } = req.body;

  try {
    for (const insc of inscripciones) {
      const yaExiste = await InscripcionService.existe(insc.asignatura_ID_Asignatura, insc.estudiante_ID_Estudiante, insc.Anio);
      if (!yaExiste) {
        await InscripcionService.crear(insc);
        
        // Crear placeholders en aplicacion para evaluaciones existentes
        try {
          const evaluaciones = await EvaluacionService.obtenerPorAsignatura(insc.asignatura_ID_Asignatura);
          
          if (evaluaciones && evaluaciones.length > 0) {
            // Obtener el ID de inscripción recién creado
            const inscripcionCreada = await InscripcionService.obtenerPorEstudianteYAsignatura(
              insc.estudiante_ID_Estudiante,
              insc.asignatura_ID_Asignatura,
              insc.Anio
            );
            
            if (inscripcionCreada) {
              for (const evaluacion of evaluaciones) {
                const indicadores = await AplicacionService.obtenerIndicadoresPorEvaluacion(
                  evaluacion.ID_Evaluacion,
                  insc.asignatura_ID_Asignatura
                );
                
                if (indicadores && indicadores.length > 0) {
                  for (const indicador of indicadores) {
                    await AplicacionService.crearPlaceholderSiNoExiste(
                      inscripcionCreada.ID_Inscripcion,
                      evaluacion.ID_Evaluacion,
                      indicador.ID_Indicador
                    );
                  }
                }
              }
            }
          }
        } catch (errorPlaceholder) {
          console.error('[InscripcionController] Error creando placeholders (no bloqueante):', errorPlaceholder.message);
          // No bloquear la inscripción si falla la creación de placeholders
        }
      }
    }

    res.status(201).json({ message: 'Inscripciones registradas correctamente' });
  } catch (error) {
    console.error('Error al inscribir:', error);
    res.status(500).json({ message: 'Error al registrar inscripciones' });
  }
};

exports.obtenerPorAsignatura = async (req, res) => {
  const id = req.params.id;
  const data = await InscripcionService.obtenerPorAsignatura(id);
  res.json(data);
};

exports.eliminar = async (req, res) => {
  const { asignatura, estudiante, anio } = req.query;

  try {
    // Usar desvinculación lógica (cambio de estado) en lugar de eliminación física
    const anioNum = anio ? parseInt(anio, 10) : null;
    const desvinculado = await InscripcionService.desvincular(asignatura, estudiante, anioNum);
    
    if (!desvinculado) {
      return res.status(404).json({ 
        error: 'No se encontró la inscripción especificada o ya está desvinculada' 
      });
    }

    res.json({ message: 'Estudiante desvinculado de la asignatura correctamente' });
  } catch (error) {
    console.error('[InscripcionController] Error al desvincular estudiante:', error);
    res.status(500).json({ error: 'Error al desvincular estudiante' });
  }
};
