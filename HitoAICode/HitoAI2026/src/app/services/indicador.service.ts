import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Indicador } from '../models/indicador.model';
import { Criterio } from '../models/criterio.model';

@Injectable({
  providedIn: 'root'
})
export class IndicadorService {
  private apiUrl = `${environment.apiUrl}/indicador`;

  constructor(private http: HttpClient) {}

  obtenerPorContenido(idContenido: number): Observable<Indicador[]> {
    return this.http.get<Indicador[]>(`${this.apiUrl}/por-contenido/${idContenido}`);
  }

  obtenerCriteriosPorIndicador(indicadorID: number): Observable<Criterio[]> {
    return this.http.get<Criterio[]>(`${this.apiUrl}/criterios/${indicadorID}`);
  }

  crear(indicador: Indicador, criterios: Criterio[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, { indicador, criterios });
  }

  actualizar(id: number, indicador: Indicador, criterios: Criterio[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, { indicador, criterios });
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}
