import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CursoAnalisis, EstudianteAnalisis } from '../models/analisis.model';

@Injectable({
  providedIn: 'root'
})
export class AnalisisService {
  // URL base del servicio de análisis
  private readonly BASE = `${environment.apiUrl}/analisis`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener análisis por curso/cohorte
   * @param asignatura - ID de la asignatura (ej: 'TIS800')
   * @param anio - Año (ej: '2025')
   * @param semestre - Semestre (ej: '8')
   * @returns Observable con competencias y RAs del curso
   */
  getCurso(asignatura: string, anio: string, semestre: string): Observable<CursoAnalisis> {
    const params = new HttpParams()
      .set('asignatura', asignatura)
      .set('anio', anio)
      .set('semestre', semestre);

    return this.http.get<CursoAnalisis>(`${this.BASE}/curso`, { params });
  }

  /**
   * Obtener análisis por estudiante
   * @param asignatura - ID de la asignatura
   * @param anio - Año
   * @param semestre - Semestre
   * @param estudiante - RUT del estudiante
   * @returns Observable con datos de logro del estudiante
   */
  getEstudiante(
    asignatura: string,
    anio: string,
    semestre: string,
    estudiante: string
  ): Observable<EstudianteAnalisis[]> {
    const params = new HttpParams()
      .set('asignatura', asignatura)
      .set('anio', anio)
      .set('semestre', semestre)
      .set('estudiante', estudiante);

    return this.http.get<EstudianteAnalisis[]>(`${this.BASE}/estudiante`, { params });
  }
}
