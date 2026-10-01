// ===============================
// Modelos para Análisis de Curso
// ===============================

/**
 * Competencia analizada para un curso/cohorte
 */
export interface CompCurso {
  ID_Competencia: string;
  Competencia: string;
  ID_Evaluacion: number;
  Evaluacion: string;
  Porcentaje_Logro_Comp: number;
  Nivel: string;
  Brecha: number;
}

/**
 * Resultado de Aprendizaje analizado para un curso/cohorte
 */
export interface RACurso {
  ID_RA: number;
  RA: string;
  ID_Competencia: string;
  Competencia: string;
  ID_Evaluacion: number;
  Evaluacion: string;
  Porcentaje_Logro_RA: number;
  Nivel: string;
  Brecha: number;
}

/**
 * Estructura completa del análisis de un curso
 */
export interface CursoAnalisis {
  competencias: CompCurso[];
  ras: RACurso[];
}

// ===============================
// Modelo para Análisis de Estudiante
// ===============================

/**
 * Análisis individual de un estudiante
 */
export interface EstudianteAnalisis {
  ID_Estudiante: string;
  Estudiante: string;
  ID_Evaluacion: number;
  Evaluacion: string;
  ID_RA: number;
  RA: string;
  ID_Competencia: string;
  Competencia: string;
  Porcentaje_Logro: number;
  Nivel: string;
  Brecha: number;
}
