import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Inscripcion } from '../models/inscripcion.model';

import { Estudiante } from '../models/estudiante.model';



export interface AlumnoCurso {
  idInscripcion: number;
  anio: number;
  semestre: number;
  idEstudiante: string;
  nombre: string;
  apellido: string;
}

@Injectable({
  providedIn: 'root'
})
export class InscripcionService {
  private apiUrl = `${environment.apiUrl}/inscripcion`;

  constructor(private http: HttpClient) {}

  // Inscribir múltiples estudiantes a una asignatura
  inscribir(inscripciones: Inscripcion[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear-masivo`, { inscripciones });
  }

  // Obtener estudiantes inscritos en una asignatura específica

  obtenerPorAsignatura(idAsignatura: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/por-asignatura/${idAsignatura}`);

  }

  // Obtener alumnos de un curso con año y semestre del período real
  getAlumnosPorCurso(idAsignatura: string, anio?: any): Observable<any[]> {
    let url = `${this.apiUrl}/alumnos-curso?asignatura=${idAsignatura}`;
    if (anio) url += `&anio=${anio}`;
    return this.http.get<any[]>(url);
  }

  // Desvincular (eliminar) una inscripción
  eliminar(idAsignatura: string, idEstudiante: string, anio?: number): Observable<any> {
    let url = `${this.apiUrl}/eliminar?asignatura=${idAsignatura}&estudiante=${idEstudiante}`;
    if (anio) url += `&anio=${anio}`;
    return this.http.delete(url);
  }
}
