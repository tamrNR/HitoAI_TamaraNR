import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { forkJoin } from 'rxjs';

import { AnaliticaService } from '../../analitica/services/analitica.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

/**
 * Panel del Decano: solo lectura sobre las carreras de su Facultad.
 * El backend ya limita carreras/asignaturas al facultadId del token.
 */
@Component({
  selector: 'app-decano-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, SidebarComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './decano-home.component.html',
  styleUrls: ['./decano-home.component.css']
})
export class DecanoHomeComponent implements OnInit {
  nombre = '';
  cargando = false;
  errorMsg = '';

  carreras: any[] = [];
  planes: any[] = [];
  cohortes: any[] = [];
  semestres: any[] = [];
  asignaturas: any[] = [];

  carreraId: any = null;
  planId: any = null;
  cohorteId: any = null;
  semestreId: any = null;
  asignaturaId: string | null = null;

  // Gráficos
  radarData: ChartConfiguration<'radar'>['data'] | null = null;
  radarOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    scales: { r: { min: 0, max: 100 } }
  };
  barrasData: ChartConfiguration<'bar'>['data'] | null = null;
  barrasOptions: ChartConfiguration<'bar'>['options'] = { responsive: true };

  // Tabla comparativa por cohorte (heatmap-curso)
  tablaCompetencias: string[] = [];
  tablaFilas: any[] = [];

  readonly ALUMNO_CURSO = '__CURSO__';

  constructor(private analiticaService: AnaliticaService) {}

  ngOnInit(): void {
    this.nombre = localStorage.getItem('nombre') || '';
    this.analiticaService.getCarreras().subscribe({
      next: (d) => {
        this.carreras = d || [];
        if (this.carreras.length === 1) {
          this.carreraId = this.carreras[0].id;
          this.cargarPlanes();
        }
      },
      error: () => this.errorMsg = 'No se pudieron cargar las carreras de tu facultad.'
    });
    this.analiticaService.getCohortes().subscribe({ next: (d) => this.cohortes = d || [] });
    this.analiticaService.getSemestres().subscribe({ next: (d) => this.semestres = d || [] });
  }

  cargarPlanes(): void {
    this.planes = [];
    this.planId = null;
    this.asignaturas = [];
    this.asignaturaId = null;
    if (this.carreraId == null) return;
    this.analiticaService.getPlanes(this.carreraId).subscribe({
      next: (d) => this.planes = d || []
    });
  }

  cargarAsignaturas(): void {
    this.asignaturas = [];
    this.asignaturaId = null;
    if (this.planId == null || this.semestreId == null) return;
    this.analiticaService.getAsignaturasPorSemestre(Number(this.planId), Number(this.semestreId)).subscribe({
      next: (d) => this.asignaturas = d || []
    });
  }

  filtrosCompletos(): boolean {
    return this.asignaturaId != null && this.cohorteId != null && this.semestreId != null;
  }

  generarAnalisis(): void {
    if (!this.filtrosCompletos()) {
      this.errorMsg = 'Selecciona asignatura, cohorte y semestre para generar el análisis.';
      return;
    }
    this.errorMsg = '';
    this.cargando = true;

    const filtros = {
      asignatura: this.asignaturaId,
      alumno: this.ALUMNO_CURSO,
      anio: this.cohorteId,
      semestre: this.semestreId
    };

    forkJoin({
      radar: this.analiticaService.getRadarCompetencias(filtros, 'competencia'),
      barras: this.analiticaService.getBarrasComparativa(filtros),
      tabla: this.analiticaService.getHeatmapCurso({ asignatura: this.asignaturaId, anio: this.cohorteId, semestre: this.semestreId })
    }).subscribe({
      next: ({ radar, barras, tabla }) => {
        const radarDatos = Array.isArray(radar) ? radar : ((radar as any)?.datos ?? []);
        this.construirRadar(radarDatos);
        this.construirBarras(barras);
        this.construirTabla(tabla);
        this.cargando = false;
      },
      error: (err) => {
        console.error('[Decano] Error generando análisis:', err);
        this.errorMsg = 'No se pudo generar el análisis. Verifica los filtros seleccionados.';
        this.cargando = false;
      }
    });
  }

  private construirRadar(datos: any[]): void {
    const labels = datos.map(d => d.nombre || d.Competencia || '');
    const valores = datos.map(d => Number(d.valor ?? d.Porcentaje_Logro ?? d.logro ?? 0));
    this.radarData = {
      labels,
      datasets: [{
        label: 'Logro promedio del curso (%)',
        data: valores,
        borderColor: '#002F5D',
        backgroundColor: 'rgba(0, 47, 93, 0.15)'
      }]
    };
  }

  private construirBarras(resp: any): void {
    if (!resp || !Array.isArray(resp.labels)) {
      this.barrasData = null;
      return;
    }
    const series = Array.isArray(resp.series) ? resp.series : [];
    this.barrasData = {
      labels: resp.labels,
      datasets: series.map((s: any, i: number) => ({
        label: s.name || `Serie ${i + 1}`,
        data: s.values || [],
        backgroundColor: i === 0 ? '#0051A2' : '#F4B41A'
      }))
    };
  }

  private construirTabla(resp: any): void {
    if (!resp || !Array.isArray(resp.competencias) || !Array.isArray(resp.filas)) {
      this.tablaCompetencias = [];
      this.tablaFilas = [];
      return;
    }
    this.tablaCompetencias = resp.competencias;
    this.tablaFilas = resp.filas;
  }

  valorCelda(fila: any, comp: string): string {
    const v = fila?.valores?.[comp];
    if (!v || v.estado !== 'con_datos' || v.logro == null) {
      return v?.estado === 'no_aplica' ? '—' : 'S/D';
    }
    return `${v.logro}%`;
  }

  claseCelda(fila: any, comp: string): string {
    const v = fila?.valores?.[comp];
    if (!v || v.estado !== 'con_datos' || v.logro == null) return 'celda-vacia';
    if (v.logro >= 75) return 'celda-alto';
    if (v.logro >= 51) return 'celda-medio';
    return 'celda-bajo';
  }
}
