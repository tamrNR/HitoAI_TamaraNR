
import { Criterio } from './criterio.model';

export interface Indicador {
  ID_Indicador?: number;
  Descripcion: string;
  Puntaje_Max: number;
  contenido_ID_Contenido: number;
  ra_ID_RA: number;
  Criterios?: Criterio[];
}
