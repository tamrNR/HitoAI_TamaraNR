import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { catchError, retry, tap, map } from 'rxjs/operators';

interface FiltrosAnalitica {
  carrera?: any;
  plan?: any;
  asignatura?: any;
  cohorte?: any;
  semestre?: any;
  alumno?: any;
  anio?: any;
  // Campos separados para distinguir entre valores del formulario y valores reales del alumno
  semestrePlan?: any;  // Semestre del plan de estudios seleccionado en el formulario (1, 2, 3...)
  anioReal?: any;      // Año real del alumno seleccionado (para backend)
  semestreReal?: any;  // Semestre real del alumno seleccionado (para backend)
  alumnoNombre?: any;  // Nombre completo del alumno para mostrar en dropdown
}

interface DatosGraficos {
  radar?: any;
  barras?: any;
  burbujas?: any;
  heatmap?: any;
  lineas?: any;
  evolucion?: any;
  tramos?: any;
}

@Injectable({ providedIn: 'root' })
export class AnaliticaService {
  private filtrosActuales: FiltrosAnalitica = {};
  private filtrosSubject = new BehaviorSubject<FiltrosAnalitica>({});
  public filtros$ = this.filtrosSubject.asObservable();

  private datosGraficos: DatosGraficos = {};
  private ultimaUrlAnalitica: string | null = null;
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const userRole = localStorage.getItem('rol') || '';
    return new HttpHeaders({
      'X-User-Role': userRole
    });
  }

  private handleError(operacion: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`[AnaliticaService] ❌ Error en ${operacion}:`, error);
      let mensajeError = 'Ocurrió un error desconocido';
      
      // No reintentar errores CORS o de conexión (status 0)
      if (error.status === 0) {
        mensajeError = 'Error de conexión o CORS. Verifica que el backend esté corriendo y la configuración CORS sea correcta.';
        console.error(`[AnaliticaService] 💬 ${mensajeError}`);
        const custom: any = new Error(mensajeError);
        custom.status = 0;
        custom.shouldRetry = false; // Flag para evitar reintentos
        return throwError(() => custom);
      }
      
      if (error.error instanceof ErrorEvent) {
        mensajeError = `Error del cliente: ${error.error.message}`;
      } else {
        const detalleServidor = (error.error && (error.error.detalle || error.error.mensaje || error.error.error)) || '';
        mensajeError = `Error del servidor: ${error.status} - ${detalleServidor || error.message}`;
        if (error.status === 404) {
          mensajeError = `Endpoint no encontrado: ${operacion}`;
        } else if (error.status === 500) {
          mensajeError = `Error interno del servidor${detalleServidor ? `: ${detalleServidor}` : ''}`;
        } else if (error.status === 409 && error.error?.error === 'curso_pendiente') {
          mensajeError = error.error?.mensaje || 'Curso pendiente de evaluaciones';
        }
      }
      console.error(`[AnaliticaService] 💬 ${mensajeError}`);
      return throwError(() => new Error(mensajeError));
    };
  }

  getUmbralAsignatura(idAsignatura: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/asignatura/umbral/${idAsignatura}`, { headers: this.getAuthHeaders() });
  }

  // ── RADAR ─────────────────────────────────────────────────────────────────
  // nivel: 'competencia' (default) → vw_logro_estudiante     (3 ejes: CD2, CG1, CP2)
  //        'fase'                  → vw_logro_estudiante_fase (6 ejes: Fase 1…6)
  getRadarCompetencias(filtros: any, nivel: 'competencia' | 'fase' = 'competencia'): Observable<any[]> {
    console.log('[AnaliticaService] 📡 Solicitando datos de radar:', filtros, '| nivel:', nivel);

    const params: string[] = [];
    if (filtros?.asignatura) params.push(`asignatura=${filtros.asignatura}`);
    if (filtros?.alumno)     params.push(`alumno=${filtros.alumno}`);
    if (filtros?.anio)       params.push(`anio=${filtros.anio}`);
    if (filtros?.semestre)   params.push(`semestre=${filtros.semestre}`);
    params.push(`nivel=${nivel}`);
    const query = `?${params.join('&')}`;

    return this.http.get<any>(`${this.baseUrl}/graficos/radar${query}`, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de radar recibidos:', data)),
      map((resp: any) => Array.isArray(resp) ? resp : (resp?.datos ?? [])),
      catchError(this.handleError('getRadarCompetencias'))
    );
  }

  // ── BARRAS ────────────────────────────────────────────────────────────────
  getBarrasComparativa(filtros: any): Observable<any> {
    console.log('[AnaliticaService] 📡 Solicitando datos de barras:', filtros);
    const params: string[] = [];
    if (filtros?.asignatura) params.push(`asignatura=${filtros.asignatura}`);
    if (filtros?.alumno)     params.push(`alumno=${filtros.alumno}`);
    if (filtros?.anio)       params.push(`anio=${filtros.anio}`);
    if (filtros?.semestre)   params.push(`semestre=${filtros.semestre}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any>(`${this.baseUrl}/graficos/barras${query}`, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de barras recibidos:', data)),
      catchError(this.handleError('getBarrasComparativa'))
    );
  }

  // ── BURBUJAS ──────────────────────────────────────────────────────────────
  getBurbujas(filtros?: any): Observable<any> {
    console.log('[AnaliticaService] 📡 Solicitando datos de burbujas:', filtros);
    const params: string[] = [];
    if (filtros?.asignatura) params.push(`asignatura=${filtros.asignatura}`);
    if (filtros?.alumno)     params.push(`alumno=${filtros.alumno}`);
    if (filtros?.anio)       params.push(`anio=${filtros.anio}`);
    if (filtros?.semestre)   params.push(`semestre=${filtros.semestre}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any>(`${this.baseUrl}/graficos/burbujas${query}`, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de burbujas recibidos:', data)),
      catchError(this.handleError('getBurbujas'))
    );
  }

  getBurbujasGeneral(filtros?: any): Observable<any> {
    return this.getBurbujas(filtros);
  }

  // ── HEATMAP ───────────────────────────────────────────────────────────────
  getHeatmap(filtros: any): Observable<any[]> {
    console.log('[AnaliticaService] 📡 Solicitando datos de heatmap:', filtros);
    const params: string[] = [];
    if (filtros?.asignatura) params.push(`asignatura=${filtros.asignatura}`);
    if (filtros?.anio)       params.push(`anio=${filtros.anio}`);
    if (filtros?.semestre)   params.push(`semestre=${filtros.semestre}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any[]>(`${this.baseUrl}/graficos/heatmap${query}`, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de heatmap recibidos:', data)),
      catchError(this.handleError('getHeatmap'))
    );
  }

  // ── HEATMAP CURSO ───────────────────────────────────────────────────────────
  getHeatmapCurso(filtros: { asignatura: any, anio: any, semestre: any }): Observable<any> {
    const params = new HttpParams()
      .set('asignatura', filtros.asignatura)
      .set('anio', filtros.anio)
      .set('semestre', filtros.semestre);
    return this.http.get<any>(`${this.baseUrl}/graficos/heatmap-curso`, { params, headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de heatmap-curso recibidos:', data)),
      catchError(this.handleError('getHeatmapCurso'))
    );
  }

  // ── LÍNEAS ─────────────────────────────────────────────────────────────────
  getLineas(filtros: any): Observable<any[]> {
    const params = new URLSearchParams();
    params.set('alumno', filtros.alumno);

    return this.http.get<any[]>(`${this.baseUrl}/graficos/lineas?${params.toString()}`, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de trayectoria recibidos:', data)),
      catchError(this.handleError('getLineas'))
    );
  }

  // ── EVOLUCIÓN ───────────────────────────────────────────────────────────────
  getEvolucionEvaluacion(filtros: any): Observable<any[]> {
    const params = new URLSearchParams();
    params.set('asignatura', filtros.asignatura);
    params.set('alumno', filtros.alumno);
    params.set('anio', filtros.anio);
    params.set('semestre', filtros.semestre);

    return this.http.get<any[]>(`${this.baseUrl}/graficos/evolucion-evaluacion?${params.toString()}`, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de evolución por evaluación recibidos:', data)),
      catchError(this.handleError('getEvolucionEvaluacion'))
    );
  }

  getDistribucionTramos(filtros: { asignatura: any, alumno: any, anio: any, semestre: any }): Observable<any> {
    const params = new URLSearchParams();
    params.set('asignatura', filtros.asignatura);
    params.set('alumno', filtros.alumno);
    params.set('anio', filtros.anio);
    params.set('semestre', filtros.semestre);

    return this.http.get<any>(`${this.baseUrl}/graficos/distribucion-tramos?${params.toString()}`, { headers: this.getAuthHeaders() }).pipe(
      retry(1),
      tap(data => console.log('[AnaliticaService] ✅ Datos de distribución por tramos recibidos:', data)),
      catchError(this.handleError('getDistribucionTramos'))
    );
  }

  // ── FILTROS DROPDOWNS ─────────────────────────────────────────────────────
  getCarreras(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/analitica/carreras`, { headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('[AnaliticaService] ✅ Carreras:', d)),
      catchError(this.handleError('getCarreras'))
    );
  }

  getPlanes(carreraId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/analitica/planes?carrera=${carreraId}`, { headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('[AnaliticaService] ✅ Planes:', d)),
      catchError(this.handleError('getPlanes'))
    );
  }

  getCohortes(): Observable<Array<{id: number, nombre: string}>> {
    return this.http.get<Array<{id: number, nombre: string}>>(`${this.baseUrl}/analitica/cohortes`, { headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('[AnaliticaService] ✅ Cohortes:', d)),
      catchError(this.handleError('getCohortes'))
    );
  }

  getSemestres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/analitica/semestres`, { headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('[AnaliticaService] ✅ Semestres:', d)),
      catchError(this.handleError('getSemestres'))
    );
  }

  getAsignaturas(carrera: number, plan: number): Observable<Array<{id: string, nombre: string}>> {
    const params = new HttpParams().set('carrera', String(carrera)).set('plan', String(plan));
    return this.http.get<Array<{id: string, nombre: string}>>(`${this.baseUrl}/analitica/asignaturas`, { params, headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('[AnaliticaService] ✅ Asignaturas:', d.length)),
      catchError(this.handleError('getAsignaturas'))
    );
  }

  getAsignaturasPorSemestre(plan: number, semestre: number): Observable<Array<{id: string, nombre: string}>> {
    const params = new HttpParams().set('plan', String(plan)).set('semestre', String(semestre));
    return this.http.get<Array<{id: string, nombre: string}>>(`${this.baseUrl}/analitica-filtros/asignaturas`, { params, headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('[AnaliticaService] ✅ Asignaturas (plan+semestre):', d.length)),
      catchError(this.handleError('getAsignaturasPorSemestre'))
    );
  }

  getAlumnos(asignatura: string, cohorte: number): Observable<Array<{id: string, nombre: string}>> {
    const params = new HttpParams().set('asignatura', asignatura).set('cohorte', String(cohorte));
    return this.http.get<Array<{id: string, nombre: string}>>(`${this.baseUrl}/analitica/alumnos`, { params, headers: this.getAuthHeaders() }).pipe(
      tap(d => console.log('[AnaliticaService] ✅ Alumnos:', d.length)),
      catchError(this.handleError('getAlumnos'))
    );
  }

  // ── IA ────────────────────────────────────────────────────────────────────
  generarAnalisisIA(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/analisis/ia`, payload, { headers: this.getAuthHeaders() }).pipe(
      retry(0),
      tap(r => console.log('[AnaliticaService] ✅ IA respondió:', r)),
      catchError(this.handleError('generarAnalisisIA'))
    );
  }

  getInsightsDashboard(payload: { charts: any[] }): Observable<{ insights: Array<{ id: string; insight: string }> }> {
    return this.http.post<{ insights: Array<{ id: string; insight: string }> }>(`${this.baseUrl}/reporte/insights`, payload, { headers: this.getAuthHeaders() }).pipe(
      retry(0), tap(r => console.log('[AnaliticaService] ✅ Insights:', r)),
      catchError(this.handleError('getInsightsDashboard'))
    );
  }

  exportarReporteAnalitica(payload: { charts: any[]; meta: any }) {
    return this.http.post(`${this.baseUrl}/reporte/exportar`, payload, {
      responseType: 'blob',
      observe: 'response',
      headers: this.getAuthHeaders()
    }).pipe(
      retry(0),
      tap(r => console.log('[AnaliticaService] ✅ Reporte exportado:', r)),
      catchError(this.handleError('exportarReporteAnalitica'))
    );
  }

  getBurbujasDetalle(filtros: any) {
    return [
      { ID_Evaluacion: 1, Competencia: 'Desarrollo de Software', Evaluacion: 'Primera Intervención', Porcentaje_Logro: 85, Brecha: 15, Nivel: 'Alto', Peso: 3 },
      { ID_Evaluacion: 2, Competencia: 'Desarrollo de Software', Evaluacion: 'Segunda Intervención', Porcentaje_Logro: 92, Brecha: 8,  Nivel: 'Excelente', Peso: 4 },
      { ID_Evaluacion: 3, Competencia: 'Desarrollo de Software', Evaluacion: 'Examen Final',          Porcentaje_Logro: 95, Brecha: 5,  Nivel: 'Excelente', Peso: 5 },
      { ID_Evaluacion: 4, Competencia: 'Trabajo en Equipo',      Evaluacion: 'Primera Intervención', Porcentaje_Logro: 75, Brecha: 25, Nivel: 'Alto', Peso: 3 },
      { ID_Evaluacion: 5, Competencia: 'Trabajo en Equipo',      Evaluacion: 'Segunda Intervención', Porcentaje_Logro: 80, Brecha: 20, Nivel: 'Alto', Peso: 4 },
      { ID_Evaluacion: 6, Competencia: 'Propuesta de Soluciones',Evaluacion: 'Primera Intervención', Porcentaje_Logro: 60, Brecha: 40, Nivel: 'Medio', Peso: 3 },
      { ID_Evaluacion: 7, Competencia: 'Propuesta de Soluciones',Evaluacion: 'Segunda Intervención', Porcentaje_Logro: 68, Brecha: 32, Nivel: 'Medio', Peso: 4 },
      { ID_Evaluacion: 8, Competencia: 'Propuesta de Soluciones',Evaluacion: 'Examen Final',          Porcentaje_Logro: 70, Brecha: 30, Nivel: 'Alto', Peso: 5 },
      { ID_Evaluacion: 9, Competencia: 'Gestión de Proyectos',   Evaluacion: 'Primera Intervención', Porcentaje_Logro: 45, Brecha: 55, Nivel: 'Bajo', Peso: 3 },
      { ID_Evaluacion:10, Competencia: 'Gestión de Proyectos',   Evaluacion: 'Segunda Intervención', Porcentaje_Logro: 52, Brecha: 48, Nivel: 'Medio', Peso: 4 },
    ];
  }

  // ── ESTADO COMPARTIDO ─────────────────────────────────────────────────────
  guardarFiltros(filtros: FiltrosAnalitica): void {
    console.log('[AnaliticaService] 💾 guardarFiltros llamado con:', JSON.stringify(filtros, null, 2));
    this.filtrosActuales = { ...filtros };
    this.filtrosSubject.next(this.filtrosActuales);
  }

  obtenerFiltros(): FiltrosAnalitica {
    return { ...this.filtrosActuales };
  }

  tieneFiltros(): boolean {
    return Object.keys(this.filtrosActuales).length > 0 &&
           Object.values(this.filtrosActuales).some(v => v !== null && v !== undefined && v !== '');
  }

  limpiarFiltros(): void {
    this.filtrosActuales = {};
    this.filtrosSubject.next({});
  }

  guardarDatosGraficos(tipo: 'radar' | 'barras' | 'burbujas' | 'heatmap' | 'lineas' | 'evolucion' | 'tramos', datos: any): void {
    this.datosGraficos[tipo] = datos;
  }

  obtenerDatosGraficos(tipo: 'radar' | 'barras' | 'burbujas' | 'heatmap' | 'lineas' | 'evolucion' | 'tramos'): any {
    return this.datosGraficos[tipo];
  }

  limpiarDatosGraficos(urlActual?: string): void {
    if (urlActual && urlActual.includes('/analitica')) return;
    this.datosGraficos = {};
  }

  limpiarTodo(urlActual?: string): void {
    if (urlActual && urlActual.includes('/analitica')) return;
    this.limpiarFiltros();
    this.limpiarDatosGraficos();
    this.ultimaUrlAnalitica = null;
  }

  registrarUrlAnalitica(url: string): void {
    this.ultimaUrlAnalitica = url;
  }

  esNavegacionExterna(urlActual: string): boolean {
    const esRutaAnalitica = urlActual.includes('/analitica');
    if (!this.ultimaUrlAnalitica && esRutaAnalitica) return true;
    if (this.ultimaUrlAnalitica && !this.ultimaUrlAnalitica.includes('/analitica') && esRutaAnalitica) return true;
    return false;
  }
}