import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Estudiante } from '../models/estudiante.model';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {
  private apiUrl = `${environment.apiUrl}/estudiante`;

  constructor(private http: HttpClient) {}

  // Obtener todos los estudiantes
  obtenerTodos(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(`${this.apiUrl}`);
  }

  // Obtener estudiantes no inscritos
  obtenerNoInscritos(): Observable<Estudiante[]> {
    return this.http.get<Estudiante[]>(`${this.apiUrl}/no-inscritos`);
  }

  // Obtener estudiantes no inscritos en una asignatura específica
  obtenerDisponibles(asignaturaId: string, anio?: number): Observable<Estudiante[]> {
    const options = anio ? { params: { anio } } : {};
    return this.http.get<Estudiante[]>(`${this.apiUrl}/disponibles/${asignaturaId}`, options);
  }

  // Crear estudiante
  crear(estudiante: Estudiante): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, estudiante);
  }

  // Actualizar estudiante
  actualizar(id: string, estudiante: Estudiante): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, estudiante);
  }

  // Eliminar estudiante
  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }

  // Cargar desde archivo CSV
  cargarDesdeCSV(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/cargar-csv`, formData);
  }
}
