import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Evaluacion } from '../models/evaluacion.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluacionService {
  private apiUrl = `${environment.apiUrl}/evaluacion`;

  constructor(private http: HttpClient) {}

  contarPorAsignatura(asignaturaID: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/contar/${asignaturaID}`);
  }

  crearConAplicaciones(data: Evaluacion & { contenidos: number[] }): Observable<any> {

    return this.http.post(`${this.apiUrl}/crear-con-aplicaciones`, data)
  }

  obtenerPorAsignatura(asignaturaID: string): Observable<Evaluacion[]> {
    return this.http.get<Evaluacion[]>(`${this.apiUrl}/por-asignatura/${asignaturaID}`);
  }
  obtenerContenidosUsados(asignaturaID: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/contenidos-usados/${asignaturaID}`);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

  actualizar(id: number, data: Partial<Evaluacion>): Observable<any> {
    return this.http.put(`${this.apiUrl}/editar/${id}`, data);
  }

}
