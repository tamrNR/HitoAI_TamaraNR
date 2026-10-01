import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Carrera } from '../models/carrera.model';

@Injectable({
  providedIn: 'root'
})
export class CarreraService {
  private apiUrl = `${environment.apiUrl}/carrera`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const userRole = localStorage.getItem('rol') || '';
    return new HttpHeaders({
      'X-User-Role': userRole
    });
  }

  getCarreras(): Observable<Carrera[]> {
    return this.http.get<Carrera[]>(`${this.apiUrl}`, { headers: this.getAuthHeaders() });
  }

  crearCarrera(data: Carrera): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, data, { headers: this.getAuthHeaders() });
  }

  actualizarCarrera(id: number, data: Carrera): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, data, { headers: this.getAuthHeaders() });
  }

  eliminarCarrera(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`, { headers: this.getAuthHeaders() });
  }

  getEstadisticas(id: number): Observable<{ total_estudiantes: number; generaciones: number[] }> {
    return this.http.get<{ total_estudiantes: number; generaciones: number[] }>(
      `${this.apiUrl}/estadisticas/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

}
