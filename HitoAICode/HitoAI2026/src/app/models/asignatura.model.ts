export interface Asignatura {
  ID_Asignatura: string;
  Nombre: string;
  Semestre: number;
  N_Hito: number;
  Plan_Academico: number;
  carrera_ID_Carrera: number;
  usuario_ID_Usuario: string;
  Carrera?: string;
  Profesor?: string;
  Estado?: string;
  Umbral?: number | null;
}
