import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Asignatura } from '../models/asignatura.model';

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private apiUrl = `${environment.apiUrl}/asignatura`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const userRole = localStorage.getItem('rol') || '';
    return new HttpHeaders({
      'X-User-Role': userRole
    });
  }

  obtenerTodas(): Observable<Asignatura[]> {
    return this.http.get<Asignatura[]>(`${this.apiUrl}`, { headers: this.getAuthHeaders() });
  }

  obtenerPorProfesor(rut: string): Observable<Asignatura[]> {
    return this.http.get<Asignatura[]>(`${this.apiUrl}/por-profesor/${rut}`, { headers: this.getAuthHeaders() });
  }

  obtenerPorCarreraDelJefe(rut: string): Observable<Asignatura[]> {
    return this.http.get<Asignatura[]>(`${this.apiUrl}/por-jefe/${rut}`, { headers: this.getAuthHeaders() });
  }


  crear(asignatura: Asignatura): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, asignatura, { headers: this.getAuthHeaders() });
  }

  actualizar(id: string, asignatura: Asignatura): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, asignatura, { headers: this.getAuthHeaders() });
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`, { headers: this.getAuthHeaders() });
  }

  actualizarUmbral(id: string, umbral: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar-umbral/${id}`, { Umbral: umbral }, { headers: this.getAuthHeaders() });
  }
}
