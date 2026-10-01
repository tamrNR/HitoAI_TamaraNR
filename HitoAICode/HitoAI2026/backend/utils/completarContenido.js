const {
  analizarCriterio,
  analisisCompetencia,
  recomendacionesCompetencia,
  conclusionCompetencias,
  recomendacionesTemas,
} = require('./openai'); // asegúrate que este sea el archivo correcto

const { calcularResumenCompetencias } = require('./resumenCompetencias');

// NUEVA función para conclusiones por criterio
function conclusionCriterios(instancia, carrera = '', asignatura = '') {
  if (!instancia || !Array.isArray(instancia.criterios)) return [];

  return instancia.criterios.map(c => {
    const indicador = c.indicador || 'Indicador no definido';
    const maximo = c.maximo ?? 'N/A';
    const minimo = c.minimo ?? 'N/A';
    const promedio = c.promedio ?? 'N/A';
    const porcentaje = c.porcentaje ?? 'N/A';

    return (
`### Indicador: ${indicador}
- **Máximo Puntaje Obtenido**: ${maximo}  
- **Mínimo Puntaje Obtenido**: ${minimo}  
- **Puntaje Promedio**: ${promedio}  
- **% de Alumnos sobre el Promedio**: ${porcentaje}%

En este indicador se evalúa la capacidad del estudiante para cumplir con el criterio "${indicador}". Este se vincula con los contenidos desarrollados en la asignatura "${asignatura}" de la carrera "${carrera}". 

De acuerdo con los resultados obtenidos, el puntaje promedio fue de ${promedio}, con un porcentaje de ${porcentaje}% de estudiantes que superaron el promedio. Esto sugiere un rendimiento ${porcentaje >= 75 ? 'destacado' : porcentaje >= 60 ? 'aceptable' : 'mejorable'} por parte del grupo.

Se recomienda reforzar los contenidos asociados a este indicador a través de prácticas, retroalimentación dirigida y actividades contextualizadas para mejorar la comprensión y aplicación del criterio evaluado.
`
    );
  });
}

async function completarInstancia(instancia, asignatura, carrera) {
  // A. Generar análisis por cada criterio
  instancia.analisis = await Promise.all(
    instancia.criterios.map(c =>
      analizarCriterio({
        indicador: c.indicador,
        competencia: c.competencia,
        evaluacion: instancia.nombre || 'Instancia',
        max: c.maximo,
        min: c.minimo,
        promedio: c.promedio,
        porcentaje: c.porcentaje,
        raNombre: c.ra || '',
        raDescripcion: c.raDescripcion || '',
        contenidoNucleo: c.contenido || '',
        contenidoDescripcion: c.contenidoDescripcion || '',
        asignaturaNombre: asignatura,
        carreraNombre: carrera,
      })
    )
  );

  // B. Calcular resumen de competencias para la instancia
  instancia.competenciasResumen = calcularResumenCompetencias(instancia.criterios).filter(
    c => c.competencia !== 'Total'
  );

  // C. Generar análisis por competencia
  instancia.competenciasAnalisis = await Promise.all(
    instancia.competenciasResumen.map(c =>
      analisisCompetencia({
        competencia: c.competencia,
        puntajeIdeal: c.puntajeIdeal,
        promedio: c.promedio,
        cumplimiento: c.cumplimiento,
        asignaturaNombre: asignatura,
        carreraNombre: carrera,
      })
    )
  );

  // D. Generar recomendaciones por competencia
  instancia.recomendacionesCompetencias = await Promise.all(
    instancia.competenciasResumen.map(c =>
      recomendacionesCompetencia(
        c.competencia,
        c.cumplimiento,
        asignatura,
        carrera
      )
    )
  );

  // E. Recomendaciones por tema (según indicadores)
  const temas = [...new Set(instancia.criterios.map(c => c.indicador))].join(', ');
  instancia.recomendaciones = [
    await recomendacionesTemas(temas, asignatura, carrera),
  ];

  // F. Conclusiones por criterio (estilo documento formal)
  instancia.conclusion = conclusionCriterios(instancia, carrera, asignatura).join('\n\n');
}

async function completarContenido(contenido) {
  const asignatura = contenido.datos.Nombre;
  const carrera = contenido.datos.Carrera;

  // A. Completar cada instancia (Primera, Segunda, etc.)
  for (const key of Object.keys(contenido.instancias)) {
    const instancia = contenido.instancias[key];
    await completarInstancia(instancia, asignatura, carrera);
  }

  // B. Unificar todos los criterios para resumen global de competencias
  const criteriosTotales = Object.values(contenido.instancias).flatMap(i => i.criterios);
  const resumenComp = calcularResumenCompetencias(criteriosTotales).filter(c => c.competencia !== 'Total');

  contenido.competencias = resumenComp;

  // C. Recomendaciones generales por competencia
  contenido.recomendacionesComp = await Promise.all(
    resumenComp.map(c =>
      recomendacionesCompetencia(
        c.competencia,
        c.cumplimiento,
        asignatura,
        carrera
      )
    )
  );

  // D. Conclusión general
  contenido.conclusion = await conclusionCompetencias({
    resumen: resumenComp.map(r => `${r.competencia}: ${r.cumplimiento}%`).join(', '),
    asignaturaNombre: asignatura,
    carreraNombre: carrera,
  });

  // E. Recomendaciones generales por tema (a nivel global)
  const temasGlobales = criteriosTotales.map(c => c.indicador).join(', ');
  contenido.recomendacionesTemasFinal = await recomendacionesTemas(
    temasGlobales,
    asignatura,
    carrera
  );

  return contenido;
}

module.exports = { completarContenido };
