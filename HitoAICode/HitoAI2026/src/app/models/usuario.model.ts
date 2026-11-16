export interface Usuario {
  ID_Usuario: string;
  Nombre: string;
  Clave?: string;
  Rol_ID_Rol?: string;
  Rol?: string;
  Facultad_ID_Facultad?: number | string;
  Carrera_ID_Carrera?: number | string;
}
