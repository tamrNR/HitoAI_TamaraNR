/**
 * Componente para mostrar análisis específico con gráfico radar, barras o burbujas
 * CAMBIOS v3:
 * - Radar: muestra ambos gráficos simultáneamente (competencia y fase) lado a lado
 *   competencia → 3 ejes institucionales (CD2, CG1, CP2)  — visión estratégica
 *   fase        → 6 ejes operativos (Fase 1…6)            — visión operativa
 */
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import { forkJoin } from 'rxjs';
import { AnaliticaService } from '../../services/analitica.service';

@Component({
  selector: 'app-an-especifico',
  templateUrl: './an-especifico.component.html',
  styleUrls: ['./an-especifico.component.css'],
  standalone: false
})
export class AnEspecificoComponent implements OnInit, OnDestroy {
  tipoGrafico: string = '';
  filtrosForm!: FormGroup;
  
  umbralActual: number = 51;
  public readonly ALUMNO_CURSO = '__CURSO__';
  public modoCursoActivo: boolean = false;

  get esModoCurso(): boolean {
    return this.filtrosForm?.value?.alumno === this.ALUMNO_CURSO;
  }

  public barrasModoCurso = false;
  private barrasCursoCounts: Array<{ cumple: number; noCumple: number }> = [];
  public evolucionData: any[] = [];
  public distribucionTramosData: any[] = [];

  @ViewChildren(BaseChartDirective) chartDirs!: QueryList<BaseChartDirective>;
  
  public umbralRadarPlugin = {
    id: 'umbralRadarLine',
    afterDraw: (chart: any) => {
      const scale = chart.scales.r;
      if (!scale) return;
      const umbral = this.umbralActual;
      const ctx = chart.ctx;
      const centerX = scale.xCenter;
      const centerY = scale.yCenter;
      const radius = scale.getDistanceFromCenterForValue(umbral);
      const numPoints = scale.getLabels().length; // cantidad de ejes reales (CD1, CD2, CD3, CG1, CG2, CP1, CP2, CS)

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2; // empieza arriba, igual que Chart.js
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(229, 57, 53, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.restore();
    }
  };

  public etiquetasBarrasPlugin = {
    id: 'etiquetasBarras',
    afterDatasetsDraw: (chart: any) => {
      if (!this.barrasModoCurso) return;
      const { ctx } = chart;
      ctx.save();
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#1a1a1a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        if (!chart.isDatasetVisible(datasetIndex)) return;
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((point: any, index: number) => {
          const value = dataset.data[index];
          if (value === null || value === undefined) return;
          ctx.fillText(`${value}%`, point.x, point.y - 8);
        });
      });
      ctx.restore();
    }
  };

  mostrarGrafico = false;
  cargando = false;
  radarSinDatos: boolean = false;
  mensajeSinDatos: string = '';

  carreras: any[] = [];
  planes: any[] = [];
  asignaturas: any[] = [];
  cohortes: any[] = [];
  semestres: any[] = [];
  alumnos: any[] = [];

  private _pendingFaseLoad = false;

  // ── Configuración gráfico RADAR ──────────────────────────────────────────
  public radarChartType: ChartType = 'radar';
  public radarChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  public radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'top',
        labels: {
          generateLabels: (chart: any) => {
            const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
            original.push({
              text: `Umbral (${this.umbralActual}%)`,
              fillStyle: 'transparent',
              strokeStyle: 'rgba(229, 57, 53, 0.6)',
              lineDash: [6, 4],
              lineWidth: 2,
              pointStyle: 'line',
              hidden: false,
              datasetIndex: -1
            });
            return original;
          }
        }
      },
      title: {
        display: true,
        text: 'Vista por Competencia (Estratégica)',
        font: { size: 18, weight: 'bold' },
        color: '#0A3D91'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 },
        pointLabels: {
          font: { size: 10 },
          callback: (label: string) => {
            const words = label.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            words.forEach(word => {
              if ((currentLine + ' ' + word).trim().length > 20) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word;
              } else {
                currentLine = (currentLine + ' ' + word).trim();
              }
            });
            if (currentLine) lines.push(currentLine.trim());
            return lines;
          }
        }
      }
    }
  };

  // ── Configuración gráfico RADAR FASE ───────────────────────────────────────
  public radarFaseChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  public radarFaseChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: {
        display: true,
        text: 'Vista por Fase (Operativa)',
        font: { size: 18, weight: 'bold' },
        color: '#0A3D91'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20 },
        pointLabels: {
          font: { size: 10 },
          callback: (label: string) => {
            const words = label.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            words.forEach(word => {
              if ((currentLine + ' ' + word).trim().length > 20) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word;
              } else {
                currentLine = (currentLine + ' ' + word).trim();
              }
            });
            if (currentLine) lines.push(currentLine.trim());
            return lines;
          }
        }
      }
    }
  };

  // ── Configuración gráfico BARRAS ─────────────────────────────────────────
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 10 }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          font: { size: 13, weight: 'bold' },
          color: '#1B3B6F',
          padding: 14
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            if (this.barrasModoCurso) {
              const counts = this.barrasCursoCounts[ctx.dataIndex] || { cumple: 0, noCumple: 0 };
              return [` Alumnos sí cumplen: ${counts.cumple}`, ` Alumnos No cumplen: ${counts.noCumple}`];
            }
            return ` ${ctx.dataset.label}: ${ctx.parsed.y ?? 0}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Competencia',
          font: { size: 13, weight: 'bold' },
          color: '#1B3B6F'
        },
        ticks: {
          font: { size: 11 },
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          callback: function(value: any, index: number) {
            const label = (this as any).getLabelForValue(index) as string;
            if (!label) return '';
            const words = label.split(' ');
            const lines: string[] = [];
            let current = '';
            words.forEach((word: string) => {
              if ((current + ' ' + word).trim().length > 20) {
                if (current) lines.push(current.trim());
                current = word;
              } else {
                current = (current + ' ' + word).trim();
              }
            });
            if (current) lines.push(current.trim());
            return lines;
          }
        },
        grid: { display: false }
      },
      y: {
        title: {
          display: true,
          text: 'Logro (%)',
          font: { size: 13, weight: 'bold' },
          color: '#1B3B6F'
        },
        min: 0,
        max: 115,
        ticks: {
          stepSize: 10,
          callback: (v: any) => (Number(v) > 100 ? '' : v + '%'),
          font: { size: 11 }
        },
        grid: { color: 'rgba(0,0,0,0.06)' }
      }
    }
  };

  // ── Configuración gráfico BURBUJAS ───────────────────────────────────────
  public bubbleChartType = 'bubble' as const;
  public bubbleChartData: ChartData<'bubble'> = { datasets: [] };
  private bubbleRaw: any[] = [];

  // ── Configuración gráfico HEATMAP ─────────────────────────────────────────
  heatmapData: any[] = [];
  heatmapMatrix: any[] = [];
  heatmapEstudiantes: string[] = [];
  heatmapCompetencias: string[] = [];

  // ── Configuración gráfico LÍNEAS ───────────────────────────────────────────
  public lineChartType = 'line' as const;
  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true,
    plugins: {
      legend: { display: true, position: 'bottom' },
      title: {
        display: true,
        text: 'Trayectoria Académica por Competencia',
        font: { size: 18, weight: 'bold' },
        color: '#0A3D91'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Porcentaje de Logro (%)',
          font: { size: 14, weight: 'bold' },
          color: '#0A3D91'
        },
        ticks: { font: { size: 12 }, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.08)' }
      },
      x: {
        title: {
          display: true,
          text: 'Semestre',
          font: { size: 14, weight: 'bold' },
          color: '#0A3D91'
        },
        ticks: { font: { size: 12 }, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.08)' }
      }
    }
  };

  // ── Configuración gráfico EVOLUCIÓN ───────────────────────────────────────────
  public evolucionChartType = 'line' as const;
  public evolucionChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public evolucionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true,
    plugins: {
      legend: { display: true, position: 'bottom' },
      title: {
        display: true,
        text: 'Evolución por Evaluación',
        font: { size: 18, weight: 'bold' },
        color: '#0A3D91'
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const codigo = String(ctx.dataset.label || '').split('·')[0].trim();
            return ` ${codigo} = ${ctx.parsed.y ?? 0}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Porcentaje de Logro (%)',
          font: { size: 14, weight: 'bold' },
          color: '#0A3D91'
        },
        ticks: { stepSize: 10, autoSkip: false, font: { size: 12 }, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.08)' }
      },
      x: {
        title: {
          display: true,
          text: 'Evaluación',
          font: { size: 14, weight: 'bold' },
          color: '#0A3D91'
        },
        ticks: { font: { size: 12 }, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.08)' }
      }
    }
  };

  public bubbleChartOptions: ChartConfiguration<'bubble'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true, position: 'bottom', align: 'center',
        labels: {
          font: { size: 11, family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
          color: '#333', padding: 10, usePointStyle: true, pointStyle: 'circle',
          boxWidth: 10, boxHeight: 10
        }
      },
      title: {
        display: true, text: 'Logro vs. Distancia al Umbral por Competencia',
        font: { size: 18, weight: 'bold' }, color: '#0A3D91'
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff',
        padding: 12, cornerRadius: 8, displayColors: true,
        callbacks: {
          title: (tooltipItems: any) => (tooltipItems[0].raw as any).competencia || 'Competencia',
          label: (context: any) => {
            if ((context.dataset as any).type === 'line') return undefined;
            const d = context.raw as any;
            return [`Logro: ${d.xOriginal || d.x}%`, `Distancia al umbral: ${d.y >= 0 ? '+' : ''}${d.y}%`, `Cumple umbral: ${d.cumpleUmbral ? 'Sí' : 'No'}`, `Indicadores que la miden: ${d.pesoReal}`];
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Porcentaje de Logro (%)', font: { size: 14, weight: 'bold', family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }, color: '#0A3D91' },
        min: -5, max: 105, ticks: { stepSize: 10, font: { size: 12 }, color: '#666' }, grid: { color: 'rgba(0,0,0,0.08)' }
      },
      y: {
        title: { display: true, text: 'Distancia al Umbral (%)', font: { size: 14, weight: 'bold', family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }, color: '#0A3D91' },
        min: undefined, max: undefined, ticks: { stepSize: 10, font: { size: 12 }, color: '#666' }, grid: { color: 'rgba(0,0,0,0.08)' }
      }
    }
  };

  // ── Estado IA ─────────────────────────────────────────────────────────────
  iaCargando = false;
  iaError = '';
  iaResultado: { analysis_text?: string; recommendations?: string[]; alerts?: string[] } | null = null;

  // ── Getters para nombres de filtros seleccionados ───────────────────────────
  get nombreCarreraSeleccionada(): string {
    const id = this.filtrosForm.value.carrera;
    return this.carreras.find(c => String(c.id) === String(id))?.nombre || id || '';
  }

  get nombrePlanSeleccionado(): string {
    const id = this.filtrosForm.value.plan;
    return this.planes.find(p => String(p.id) === String(id))?.nombre || id || '';
  }

  get nombreCohorteSeleccionada(): string {
    const id = this.filtrosForm.value.cohorte;
    return this.cohortes.find(c => String(c.id) === String(id))?.nombre || id || '';
  }

  get nombreSemestreSeleccionado(): string {
    const id = this.filtrosForm.value.semestre;
    return this.semestres.find(s => String(s.id) === String(id))?.nombre || id || '';
  }

  get nombreAsignaturaSeleccionada(): string {
    const id = this.filtrosForm.value.asignatura;
    return this.asignaturas.find(a => String(a.id) === String(id))?.nombre || id || '';
  }

  get nombreAlumnoSeleccionado(): string {
    const id = this.filtrosForm.value.alumno;
    if (id === this.ALUMNO_CURSO) return 'Curso Completo';
    return this.alumnos.find(a => String(a.id) === String(id))?.nombre || id || '';
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private analiticaService: AnaliticaService,
    private cdr: ChangeDetectorRef
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CICLO DE VIDA
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const graficoParam = params.get('grafico');
      if (graficoParam === 'radar' || graficoParam === 'barras' || graficoParam === 'burbujas' || graficoParam === 'heatmap' || graficoParam === 'lineas' || graficoParam === 'evolucion' || graficoParam === 'tramos') {
        this.tipoGrafico = graficoParam;
        this.inicializarFormulario();
        this.cargarDatosFiltros();
        this.restaurarFiltrosYGenerarGraficos();
        this.analiticaService.registrarUrlAnalitica(this.router.url);
      } else {
        this.router.navigate(['../general'], { relativeTo: this.route });
      }
    });
  }

  ngOnDestroy(): void {
    this.analiticaService.registrarUrlAnalitica(this.router.url);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMULARIO Y FILTROS
  // ═══════════════════════════════════════════════════════════════════════════

  inicializarFormulario(): void {
    this.filtrosForm = this.fb.group({
      carrera:    ['', Validators.required],
      plan:       [{ value: '', disabled: true }, Validators.required],
      asignatura: [''],
      cohorte:    ['', Validators.required],
      semestre:   ['', Validators.required],
      alumno:     ['']
    });
  }

  cargarDatosFiltros(): void {
    this.analiticaService.getCarreras().subscribe(data => this.carreras = data);
    this.analiticaService.getCohortes().subscribe(data => this.cohortes = data);
    this.analiticaService.getSemestres().subscribe(data => this.semestres = data);

    this.filtrosForm.get('carrera')?.valueChanges.subscribe(carreraId => {
      const planCtrl = this.filtrosForm.get('plan');
      if (carreraId) {
        this.analiticaService.getPlanes(carreraId).subscribe(data => {
          this.planes = data;
          planCtrl?.enable();
        });
      } else {
        this.planes = [];
        planCtrl?.setValue('');
        planCtrl?.disable();
      }
    });

    this.filtrosForm.get('plan')?.valueChanges.subscribe(() => this.loadAsignaturasAndReset());
    this.filtrosForm.get('semestre')?.valueChanges.subscribe(() => this.loadAsignaturasAndReset());
    this.filtrosForm.get('asignatura')?.valueChanges.subscribe(() => this.loadAlumnosAndReset());
    this.filtrosForm.get('cohorte')?.valueChanges.subscribe(() => this.loadAlumnosAndReset());
  }

  private loadAsignaturasAndReset(): void {
    const asignaturaCtrl = this.filtrosForm.get('asignatura');
    this.asignaturas = [];
    this.alumnos = [];
    this.filtrosForm.patchValue({ asignatura: null, alumno: null }, { emitEvent: false });

    const plan     = this.filtrosForm.value.plan     as number | null;
    const semestre = this.filtrosForm.value.semestre as number | null;

    if (!plan || !semestre) { asignaturaCtrl?.disable({ emitEvent: false }); return; }

    this.analiticaService.getAsignaturasPorSemestre(plan, semestre).subscribe({
      next: (data) => {
        this.asignaturas = data || [];
        asignaturaCtrl?.enable({ emitEvent: false });
        const actual = this.filtrosForm.value.asignatura;
        if (actual && !this.asignaturas.some((a: any) => String(a.id) === String(actual))) {
          this.filtrosForm.patchValue({ asignatura: null }, { emitEvent: false });
        }
      },
      error: () => { this.asignaturas = []; asignaturaCtrl?.enable({ emitEvent: false }); }
    });
  }

  private loadAlumnosAndReset(): void {
    this.alumnos = [];
    const asignatura = this.filtrosForm.value.asignatura as string | null;
    const cohorte    = this.filtrosForm.value.cohorte    as number | null;
    if (!asignatura || !cohorte) return;

    this.analiticaService.getAlumnos(asignatura, cohorte).subscribe({
      next: (data) => this.alumnos = data || [],
      error: () => this.alumnos = []
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESTAURAR FILTROS
  // ═══════════════════════════════════════════════════════════════════════════

  restaurarFiltrosYGenerarGraficos(): void {
    const filtros = this.analiticaService.obtenerFiltros();
    const valido = Object.keys(filtros).length > 0 &&
                   Object.values(filtros).some(v => v !== null && v !== undefined && v !== '');
    if (!valido) { console.log('[AnEspecifico] ⚠️ No hay filtros para restaurar'); return; }

    console.log('[AnEspecifico] 🔄 Restaurando filtros:', filtros);

    setTimeout(() => {
      this.analiticaService.getCohortes().subscribe(cohortesData => {
        this.cohortes = cohortesData || [];

        if (filtros.carrera) {
          this.filtrosForm.get('carrera')?.setValue(filtros.carrera, { emitEvent: true });
        }

        if (filtros.cohorte) {
          const existe = this.cohortes.some(
            (c: any) => String(c.id) === String(filtros.cohorte) || Number(c.id) === Number(filtros.cohorte)
          );
          if (existe) this.filtrosForm.get('cohorte')?.setValue(filtros.cohorte, { emitEvent: false });
        }

        if (filtros.carrera) {
          this.analiticaService.getPlanes(filtros.carrera).subscribe(planes => {
            this.planes = planes;
            const planCtrl = this.filtrosForm.get('plan');
            planCtrl?.enable();
            if (filtros.plan) planCtrl?.setValue(filtros.plan, { emitEvent: false });

            if (filtros.semestrePlan || filtros.semestre) {
              this.filtrosForm.get('semestre')?.setValue(
                filtros.semestrePlan || filtros.semestre, 
                { emitEvent: false }
              );

              this.analiticaService.getAsignaturasPorSemestre(filtros.plan, filtros.semestrePlan || filtros.semestre).subscribe({
                next: (asignaturasData) => {
                  this.asignaturas = asignaturasData || [];
                  const asignaturaCtrl = this.filtrosForm.get('asignatura');
                  asignaturaCtrl?.enable();

                  if (filtros.asignatura) {
                    const existeAsig = this.asignaturas.some(
                      (a: any) => String(a.id) === String(filtros.asignatura)
                    );
                    if (existeAsig) {
                      asignaturaCtrl?.setValue(filtros.asignatura, { emitEvent: false });

                      this.analiticaService.getAlumnos(filtros.asignatura, filtros.cohorte).subscribe({
                        next: (alumnosData) => {
                          this.alumnos = alumnosData || [];
                          const alumnoCtrl = this.filtrosForm.get('alumno');

                          if (filtros.alumno) {
                            // Si no está en la lista, agregar manualmente para que el dropdown lo muestre
                            const existeEnLista = this.alumnos.some(
                              (a: any) => String(a.id) === String(filtros.alumno)
                            );
                            if (!existeEnLista && filtros.alumnoNombre) {
                              this.alumnos = [
                                ...this.alumnos,
                                { id: filtros.alumno, nombre: filtros.alumnoNombre }
                              ];
                            }
                            alumnoCtrl?.setValue(filtros.alumno, { emitEvent: false });
                          }

                          const datosGrafico = this.analiticaService.obtenerDatosGraficos(
                            this.tipoGrafico as 'radar' | 'barras' | 'burbujas' | 'heatmap'
                          );

                          const datosGrafico2 = this.analiticaService.obtenerDatosGraficos(
                            this.tipoGrafico as 'radar' | 'barras' | 'burbujas' | 'heatmap'
                          );
                          console.log('[DEBUG] datosGrafico2 desde caché:', JSON.stringify(datosGrafico2)?.substring(0, 200));

                          if (datosGrafico2) {
                            // Restaurar umbral desde caché de burbujas antes de procesar radar
                            const datosBurbujas = this.analiticaService.obtenerDatosGraficos('burbujas');
                            if (datosBurbujas?.umbral) {
                              this.umbralActual = datosBurbujas.umbral;
                            }

                            this.aplicarDatosGrafico(datosGrafico2);
                            this.mostrarGrafico = true;

                            // Si faltaron datos de fase, cargarlos ahora
                            if (this._pendingFaseLoad && this.tipoGrafico === 'radar') {
                              this._pendingFaseLoad = false;
                              const filtrosGuardados = this.analiticaService.obtenerFiltros();
                              const rawValues = this.filtrosForm.getRawValue();

                              const anioReal     = (filtrosGuardados as any).anioReal;
                              const semestreReal = (filtrosGuardados as any).semestreReal;

                              // ← AGREGAR: solo llamar si tenemos anio y semestre reales
                              if (!anioReal || !semestreReal) {
                                console.warn('[AnEspecifico] ⚠️ No hay anioReal/semestreReal, omitiendo carga de fase');
                                return;
                              }

                              const filtrosParaBackend = {
                                asignatura: filtrosGuardados.asignatura || rawValues.asignatura,
                                alumno:     filtrosGuardados.alumno     || rawValues.alumno,
                                anio:       anioReal,
                                semestre:   semestreReal
                              };
                              console.log('[AnEspecifico] 🔍 filtrosParaBackend (fase):', filtrosParaBackend);
                              console.log('[AnEspecifico] 🔍 anioReal (fase):', anioReal);
                              console.log('[AnEspecifico] 🔍 semestreReal (fase):', semestreReal);
                              this.analiticaService.getRadarCompetencias(filtrosParaBackend, 'fase').subscribe({
                                next: (fase) => {
                                  this.radarFaseChartData = {
                                    labels: fase.map((d: any) => d.nombre),
                                    datasets: [{
                                      label: 'Logro por fase',
                                      data: fase.map((d: any) => Number(d.valor)),
                                      backgroundColor: 'rgba(10, 61, 145, 0.2)',
                                      borderColor: '#0A3D91', borderWidth: 2,
                                      pointBackgroundColor: fase.map((d: any) =>
                                        Number(d.valor) < this.umbralActual ? '#e53935' : '#0A3D91'
                                      ),
                                      pointBorderColor: '#fff',
                                      pointRadius: 6,
                                      pointHoverBackgroundColor: '#fff',
                                      pointHoverBorderColor: '#0A3D91'
                                    }]
                                  };
                                  this.cdr.detectChanges();
                                },
                                error: () => console.warn('[AnEspecifico] No se pudo cargar radar de fase')
                              });
                            }
                            
                            // Forzar repintado después de que Angular procese mostrarGrafico
                            // Aplica a todos los tipos de gráfico restaurados desde caché
                            setTimeout(() => {
                              this.cdr.detectChanges();
                              this.chartDirs.forEach(dir => dir.chart?.update());
                            }, 0);
                          } else {
                            this.generarAnalisis();
                          }
                        },
                        error: () => {
                          if (filtros.alumno) {
                            this.filtrosForm.get('alumno')?.setValue(filtros.alumno, { emitEvent: false });
                          }
                          this.generarAnalisis();
                        }
                      });
                    }
                  }
                },
                error: () => this.asignaturas = []
              });
            }
          });
        }
      });
    }, 300);
  }



  
  
  private aplicarDatosGrafico(datos: any): void {
    if (this.tipoGrafico === 'radar') {
      if (datos?.competencia && datos?.fase) {
        // Crear nuevas referencias para forzar detección de cambios en Chart.js
        this.radarChartData = {
          labels:   [...(datos.competencia.labels   || [])],
          datasets: datos.competencia.datasets.map((ds: any) => ({ ...ds, data: [...(ds.data || [])] }))
        };
        this.radarFaseChartData = {
          labels:   [...(datos.fase.labels   || [])],
          datasets: datos.fase.datasets.map((ds: any) => ({ ...ds, data: [...(ds.data || [])] }))
        };
        this._pendingFaseLoad = false;
        this.modoCursoActivo = !!datos.modoCurso;
        this.cdr.detectChanges();  // ← forzar actualización
      } else if (datos?.labels) {
        this.radarChartData   = datos;
        this._pendingFaseLoad = true;
      }
    } else if (this.tipoGrafico === 'barras') {
      if (datos?.chartData) {
        this.barChartData = datos.chartData;
        this.barrasModoCurso = !!datos.modoCurso;
        this.barrasCursoCounts = datos.counts ?? [];
      } else if (datos?.labels && Array.isArray(datos?.datasets)) {
        const cursoDataset = datos.datasets.find((d: any) => d.label === '% Alumnos que cumplen umbral');
        if (cursoDataset) {
          this.barChartData = this.construirBarChartDataCurso(datos.labels, cursoDataset.data ?? []);
          this.barrasModoCurso = true;
          this.barrasCursoCounts = [];
        } else {
          const promedioValues = datos.datasets.find((d: any) => d.label === 'Promedio General')?.data ?? [];
          const alumnoValues = datos.datasets.find((d: any) => d.label === 'Alumno')?.data ?? [];
          this.barChartData = this.construirBarChartData(datos.labels, promedioValues, alumnoValues);
          this.barrasModoCurso = false;
          this.barrasCursoCounts = [];
        }
      } else {
        this.barChartData = datos;
      }
      this.modoCursoActivo = this.barrasModoCurso;
    } else if (this.tipoGrafico === 'burbujas') {
      if (Array.isArray(datos)) {
        // Formato viejo (compatibilidad): array plano, sin umbral guardado, usar default 51
        this.umbralActual = 51;
        this.bubbleRaw = datos;
        this.buildBubbleChart(datos);
      } else if (datos.items) {
        // Formato nuevo: objeto con items y umbral
        this.umbralActual = datos.umbral ?? 51;
        this.bubbleRaw = datos.items;
        this.buildBubbleChart(datos.items);
      } else {
        this.bubbleChartData = datos;
      }
      this.cdr.detectChanges();
    } else if (this.tipoGrafico === 'heatmap') {
      this.heatmapData = datos;
      this.processHeatmapDataCurso(datos);
    } else if (this.tipoGrafico === 'lineas') {
      if (Array.isArray(datos)) { this.buildLineChart(datos); }
      else { this.lineChartData = datos; }
      this.cdr.detectChanges();
    } else if (this.tipoGrafico === 'evolucion') {
      if (Array.isArray(datos)) {
        this.evolucionData = datos;
        this.buildEvolucionChart(datos);
      } else {
        this.evolucionChartData = datos;
      }
      this.cdr.detectChanges();
    } else if (this.tipoGrafico === 'tramos') {
      this.distribucionTramosData = datos?.filas || [];
      this.modoCursoActivo = datos?.modo === 'curso';
      this.cdr.detectChanges();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAR ANÁLISIS
  // ═══════════════════════════════════════════════════════════════════════════

  generarAnalisis(): void {
    const rawValues = this.filtrosForm.getRawValue();

    // "Congelar" el modo Curso solo al presionar Generar Análisis
    this.modoCursoActivo = rawValues.alumno === this.ALUMNO_CURSO;

    const camposVacios = Object.entries(rawValues).filter(([key, value]) => {
      if (key === 'alumno' && this.tipoGrafico === 'heatmap') return false;
      return !value || value === '';
    });

    if (camposVacios.length > 0) {
      console.warn('[AnEspecifico] Campos vacíos:', camposVacios.map(([key]) => key));
      alert('Por favor completa todos los filtros');
      return;
    }

    const filtrosGuardados = this.analiticaService.obtenerFiltros();
    const filtrosParaBackend = {
      asignatura: rawValues.asignatura,
      alumno:     rawValues.alumno,
      anio:       (filtrosGuardados as any).anioReal     || Number(rawValues.cohorte) + 5,
      semestre:   (filtrosGuardados as any).semestreReal || Number(rawValues.semestre)
    };
    

    
    console.log('[AnEspecifico] 🔍 filtrosParaBackend:', filtrosParaBackend);
    console.log('[AnEspecifico] 🔍 anioReal:', (filtrosGuardados as any).anioReal);
    console.log('[AnEspecifico] 🔍 semestreReal:', (filtrosGuardados as any).semestreReal);

    console.log('[AnEspecifico] 🚀 Backend params:', filtrosParaBackend, '| Tipo:', this.tipoGrafico);
    this.cargando = true;
    this.mostrarGrafico = false;
    this.iaResultado = null;
    this.iaError = '';

    console.log('[DEBUG] radarFaseChartData a guardar:', JSON.stringify(this.radarFaseChartData));
    // ── RADAR ────────────────────────────────────────────────────────────────
    if (this.tipoGrafico === 'radar') {
      // Consultar umbral de la asignatura ANTES de generar gráficos
      this.analiticaService.getUmbralAsignatura(rawValues.asignatura).subscribe({
        next: (resp) => {
          this.umbralActual = resp?.Umbral ?? 51;
          this.ejecutarRadarConUmbral(filtrosParaBackend);
        },
        error: () => {
          this.umbralActual = 51;
          this.ejecutarRadarConUmbral(filtrosParaBackend);
        }
      });

    // ── BARRAS ───────────────────────────────────────────────────────────────
    } else if (this.tipoGrafico === 'barras') {
      this.analiticaService.getBarrasComparativa(filtrosParaBackend).subscribe({
        next: (data: any) => {
          console.log('[Barras] ✅ Datos recibidos:', data);

          const labels = data.labels ?? [];

          if (data.modo === 'curso') {
            const cursoValues = data.series?.[0]?.values ?? [];
            this.barChartData = this.construirBarChartDataCurso(labels, cursoValues);
            this.barrasModoCurso = true;
            const numCumple = data.extra?.numCumple ?? [];
            const numNoCumple = data.extra?.numNoCumple ?? [];
            this.barrasCursoCounts = labels.map((_: any, i: number) => ({
              cumple: numCumple[i] ?? 0,
              noCumple: numNoCumple[i] ?? 0
            }));
          } else {
            const promedioValues = data.series?.find((s: any) => s.name === 'Promedio General')?.values ?? [];
            const alumnoValues   = data.series?.find((s: any) => s.name === 'Alumno')?.values ?? [];
            this.barChartData = this.construirBarChartData(labels, promedioValues, alumnoValues);
            this.barrasModoCurso = false;
            this.barrasCursoCounts = [];
          }

          this.analiticaService.guardarDatosGraficos('barras', {
            chartData: this.barChartData,
            modoCurso: this.barrasModoCurso,
            counts: this.barrasCursoCounts
          });
          this.mostrarGrafico = true;
          this.cargando = false;
          this.generarAnalisisIA();
        },
        error: (err: any) => {
          console.error('[Barras] ❌ Error:', err);
          this.cargando = false;
          alert('Error al cargar datos de barras.');
        }
      });

    // ── BURBUJAS ─────────────────────────────────────────────────────────────
    } else if (this.tipoGrafico === 'burbujas') {
      this.analiticaService.getBurbujas(filtrosParaBackend).subscribe({
        next: (datosBurbujas) => {
          const items = datosBurbujas.items || datosBurbujas;
          const umbralAsignatura = datosBurbujas.umbral ?? 51;
          this.umbralActual = umbralAsignatura;
          this.bubbleRaw = items;
          this.analiticaService.guardarDatosGraficos('burbujas', { items, umbral: umbralAsignatura });
          this.buildBubbleChart(items);
          this.cdr.detectChanges();
          this.mostrarGrafico = true;
          this.cargando = false;
          this.generarAnalisisIA();
        },
        error: (error) => {
          console.error('[AnEspecifico] ❌ Error burbujas:', error);
          this.cargando = false;
          alert('Error al cargar datos de burbujas.');
        }
      });

    // ── HEATMAP ──────────────────────────────────────────────────────────────
    } else if (this.tipoGrafico === 'heatmap') {
      const filtrosHeatmap = {
        asignatura: filtrosParaBackend.asignatura,
        anio: filtrosParaBackend.anio,
        semestre: filtrosParaBackend.semestre
      };

      this.analiticaService.getHeatmapCurso(filtrosHeatmap).subscribe({
        next: (datosHeatmap) => {
          this.heatmapData = datosHeatmap;
          this.processHeatmapDataCurso(datosHeatmap);
          this.analiticaService.guardarDatosGraficos('heatmap', datosHeatmap);
          this.mostrarGrafico = true;
          this.cargando = false;
          this.generarAnalisisIA();
        },
        error: (error) => {
          console.error('[AnEspecifico] ❌ Error heatmap:', error);
          this.cargando = false;
          alert('Error al cargar datos del mapa de calor.');
        }
      });

    // ── LÍNEAS ────────────────────────────────────────────────────────────────
    } else if (this.tipoGrafico === 'lineas') {
      const filtrosLineas = {
        alumno: rawValues.alumno
      };

      this.analiticaService.getLineas(filtrosLineas).subscribe({
        next: (datosLineas) => {
          this.buildLineChart(datosLineas);
          this.analiticaService.guardarDatosGraficos('lineas', datosLineas);
          this.mostrarGrafico = true;
          this.cargando = false;
          this.generarAnalisisIA();
        },
        error: (error) => {
          console.error('[AnEspecifico] ❌ Error líneas:', error);
          this.cargando = false;
          alert('Error al cargar datos del gráfico de líneas.');
        }
      });

    // ── EVOLUCIÓN ────────────────────────────────────────────────────────────────
    } else if (this.tipoGrafico === 'evolucion') {
      this.analiticaService.getEvolucionEvaluacion(filtrosParaBackend).subscribe({
        next: (datosEvolucion) => {
          this.evolucionData = datosEvolucion;
          this.buildEvolucionChart(datosEvolucion);
          this.analiticaService.guardarDatosGraficos('evolucion', datosEvolucion);
          this.mostrarGrafico = true;
          this.cargando = false;
          this.generarAnalisisIA();
        },
        error: (error) => {
          console.error('[AnEspecifico] ❌ Error evolución:', error);
          this.cargando = false;
          alert('Error al cargar datos del gráfico de evolución por evaluación.');
        }
      });

    // ── DISTRIBUCIÓN POR TRAMOS ───────────────────────────────────────────────────
    } else if (this.tipoGrafico === 'tramos') {
      this.analiticaService.getDistribucionTramos(filtrosParaBackend).subscribe({
        next: (data) => {
          this.distribucionTramosData = data?.filas || [];
          this.modoCursoActivo = data?.modo === 'curso';
          this.analiticaService.guardarDatosGraficos('tramos', data);
          this.mostrarGrafico = true;
          this.cargando = false;
          this.generarAnalisisIA();
        },
        error: (error) => {
          console.error('[AnEspecifico] ❌ Error distribución por tramos:', error);
          this.cargando = false;
          alert('Error al cargar la tabla de distribución por tramos.');
        }
      });

    } else {
      this.cargando = false;
      alert('Tipo de gráfico no reconocido.');
    }
  }

  private ejecutarRadarConUmbral(filtrosParaBackend: any): void {
    forkJoin({
      competencia: this.analiticaService.getRadarCompetencias(filtrosParaBackend, 'competencia'),
      fase: this.analiticaService.getRadarCompetencias(filtrosParaBackend, 'fase')
    }).subscribe({
      next: ({ competencia, fase }) => {
        console.log('[Radar] Competencia data:', competencia);
        console.log('[Radar] Fase data:', fase);

        // Check for empty data
        if (!competencia || !Array.isArray(competencia) || competencia.length === 0) {
          console.warn('[AnEspecifico] ⚠️ Radar sin datos para los filtros seleccionados');
          this.radarSinDatos = true;
          this.mensajeSinDatos = 'No hay evaluaciones registradas para este alumno en el período indicado.';
          this.mostrarGrafico = false;
          this.cargando = false;
          return;
        }
        this.radarSinDatos = false;

        // Radar competencia (izquierda)
        this.radarChartData = {
          labels: competencia.map((d: any) => d.nombre),
          datasets: [{
            label: 'Logro por competencia',
            data: competencia.map((d: any) => Number(d.valor)),
            backgroundColor: 'rgba(10, 61, 145, 0.2)',
            borderColor: '#0A3D91', borderWidth: 2,
            pointBackgroundColor: '#0A3D91', pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#0A3D91'
          }]
        };
        // Radar fase (derecha)
        this.radarFaseChartData = {
          labels: fase.map((d: any) => d.nombre),
          datasets: [{
            label: 'Logro por fase',
            data: fase.map((d: any) => Number(d.valor)),
            backgroundColor: 'rgba(10, 61, 145, 0.2)',
            borderColor: '#0A3D91', borderWidth: 2,
            pointBackgroundColor: fase.map((d: any) =>
              Number(d.valor) < this.umbralActual ? '#e53935' : '#0A3D91'
            ),
            pointBorderColor: '#fff',
            pointRadius: 6,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#0A3D91'
          }]
        };
        this.analiticaService.guardarDatosGraficos('radar', {
          competencia: this.radarChartData,
          fase: this.radarFaseChartData,
          modoCurso: filtrosParaBackend.alumno === this.ALUMNO_CURSO
        });
        this.mostrarGrafico = true;
        this.cargando = false;
        this.generarAnalisisIA();
      },
      error: (error) => {
        console.error('[AnEspecifico] ❌ Error radar:', error);
        this.cargando = false;
        alert('Error al cargar datos de radar.');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS BURBUJAS
  // ═══════════════════════════════════════════════════════════════════════════

  private buildBubbleChart(data: any[]): void {
    if (!data || !data.length) { this.bubbleChartData = { datasets: [] }; return; }

    // Calcular array completo de pesos curriculares para escalado dinámico
    const pesosCurriculares = data.map((d: any) => Number(d.r));
    
    const escalarR = (valor: number, valores: number[]): number => {
      const minR = 8;
      const maxR = 28;
      const minVal = Math.min(...valores);
      const maxVal = Math.max(...valores);

      if (minVal === maxVal) {
        // Todos los pesos son iguales, usar radio intermedio fijo
        return (minR + maxR) / 2;
      }

      // Interpolación por ÁREA (radio al cuadrado), no por radio directo:
      // el ojo humano percibe el tamaño de un círculo según su área, no su
      // radio, así que interpolar el radio linealmente exagera visualmente
      // diferencias pequeñas en el dato real.
      const areaMin = minR * minR;
      const areaMax = maxR * maxR;
      const areaInterpolada = areaMin + ((valor - minVal) / (maxVal - minVal)) * (areaMax - areaMin);
      return Math.sqrt(areaInterpolada);
    };
    const paletaCompetencias: Record<string, string> = {
      CD1: '#1E88E5', CD2: '#43A047', CD3: '#FB8C00', CG1: '#8E24AA',
      CG2: '#00ACC1', CP1: '#D81B60', CP2: '#FDD835', CS: '#6D4C41'
    };
    const colorPorCompetencia = (competenciaTexto: string): string => {
      const codigo = String(competenciaTexto).split('·')[0].trim();
      return paletaCompetencias[codigo] || '#999999';
    };

    const bubbleDatasets = data.map((d: any, i: number) => {
      const pesoReal = Number(d.r); // Guardar valor original ANTES de cualquier transformación
      return {
        label: d.competencia,
        data: [{
          x: Number(d.x),
          y: Number(d.y),
          r: escalarR(pesoReal, pesosCurriculares),
          competencia: d.competencia,
          cumpleUmbral: d.cumpleUmbral,
          xOriginal: Number(d.x), // Guardar valor original para tooltip
          pesoReal: pesoReal // Usar el valor original guardado, no d.r transformado
        }],
        backgroundColor: colorPorCompetencia(d.competencia) + '55',
        borderColor:     colorPorCompetencia(d.competencia),
        borderWidth: 2
      };
    });

    console.log('[DEBUG] umbralActual al construir la línea:', this.umbralActual);

    // Dataset adicional para línea de umbral (y=0)
    const umbralLineDataset = {
      type: 'line',
      label: `Umbral (${this.umbralActual}%)`,
      data: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      borderColor: '#9e9e9e',
      borderDash: [5, 5],
      pointRadius: 0,
      showLine: true,
      fill: false,
      borderWidth: 2
    };

    this.bubbleChartData = {
      datasets: [...bubbleDatasets, umbralLineDataset] as any[]
    };

    const distancias = data.map((d: any) => Number(d.y));
    const minDistancia = Math.min(...distancias);
    const maxDistancia = Math.max(...distancias);
    const paddingY = Math.max(10, Math.abs(maxDistancia - minDistancia) * 0.1);

    const logros = data.map((d: any) => Number(d.x));
    const minLogro = Math.min(...logros);
    const maxLogro = Math.max(...logros);
    const paddingX = Math.max(5, Math.abs(maxLogro - minLogro) * 0.15);

    if (this.bubbleChartOptions?.scales) {
      (this.bubbleChartOptions.scales as any)['y'].min = minDistancia - paddingY;
      (this.bubbleChartOptions.scales as any)['y'].max = maxDistancia + paddingY;
      (this.bubbleChartOptions.scales as any)['x'].min = Math.max(0, minLogro - paddingX);
      (this.bubbleChartOptions.scales as any)['x'].max = Math.min(100, maxLogro + paddingX);
    }
  }

  // ── HELPERS HEATMAP ───────────────────────────────────────────────────────

  private processHeatmapDataCurso(data: any): void {
    if (!data || !Array.isArray(data.filas) || !Array.isArray(data.competencias)) {
      this.heatmapMatrix = []; this.heatmapEstudiantes = []; this.heatmapCompetencias = [];
      return;
    }

    this.heatmapCompetencias = data.competencias;
    this.heatmapEstudiantes = data.filas.map((f: any) => f.label);

    this.heatmapMatrix = data.filas.map((fila: any) => {
      const row: any = { estudiante: fila.label, tipo: fila.tipo };
      this.heatmapCompetencias.forEach(competencia => {
        row[competencia] = fila.valores?.[competencia] ?? { estado: 'no_aplica', logro: null };
      });
      return row;
    });
  }

  private rgbDegradado(valor: number): [number, number, number] {
    const clamped = Math.max(0, Math.min(100, valor));
    if (clamped <= 50) {
      const t = clamped / 50;
      return [
        Math.round(211 + (255 - 211) * t),
        Math.round(47 + (193 - 47) * t),
        Math.round(47 + (7 - 47) * t)
      ];
    }
    const t = (clamped - 50) / 50;
    return [
      Math.round(255 + (76 - 255) * t),
      Math.round(193 + (175 - 193) * t),
      Math.round(7 + (80 - 7) * t)
    ];
  }

  getHeatmapColor(celda: { estado: string, logro: number | null } | null): string {
    if (!celda || celda.estado === 'no_aplica') return '#e0e0e0';
    if (celda.estado === 'sin_evaluar') return '#f5f5f5';
    const valor = celda.logro ?? 0;
    const [r, g, b] = this.rgbDegradado(valor);
    return `rgb(${r}, ${g}, ${b})`;
  }

  getTextColorForHeatmap(celda: { estado: string, logro: number | null } | null): string {
    if (!celda || celda.estado !== 'con_datos') return '#666';
    const valor = celda.logro ?? 0;
    const [r, g, b] = this.rgbDegradado(valor);
    const luminancia = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminancia > 150 ? '#333' : '#fff';
  }

  getHeatmapCellText(celda: { estado: string, logro: number | null } | null): string {
    if (!celda) return '-';
    if (celda.estado === 'no_aplica') return 'N/A';
    if (celda.estado === 'sin_evaluar') return 'Pendiente';
    return celda.logro !== null ? String(celda.logro) : '-';
  }

  // ── HELPERS LÍNEAS ───────────────────────────────────────────────────────────

  private construirBarChartData(labels: any[], promedioValues: any[], alumnoValues: any[]): ChartData<'bar'> {
    return {
      labels: labels,
      datasets: [
        {
          label: 'Promedio General',
          data: promedioValues,
          backgroundColor: '#1B3B6F',
          borderRadius: 4,
          barPercentage: 0.75,
          categoryPercentage: 0.8
        },
        {
          label: 'Alumno',
          data: alumnoValues,
          backgroundColor: '#5BC8E8',
          borderRadius: 4,
          barPercentage: 0.75,
          categoryPercentage: 0.8
        }
      ]
    };
  }

  private construirBarChartDataCurso(labels: any[], values: any[]): ChartData<'bar'> {
    return {
      labels: labels,
      datasets: [
        {
          label: '% Alumnos que cumplen umbral',
          data: values,
          backgroundColor: '#1B3B6F',
          borderRadius: 4,
          barPercentage: 0.75,
          categoryPercentage: 0.8
        }
      ]
    };
  }

  private buildLineChart(data: any[]): void {
    const items = Array.isArray(data) ? data : [];
    if (!items.length) { this.lineChartData = { labels: [], datasets: [] }; return; }

    // Eje X: semestres únicos ordenados
    const semestresUnicos = [...new Set(items.map((d: any) => Number(d.semestre)))]
      .sort((a, b) => a - b);
    const labels = semestresUnicos.map((s: number) => `Semestre ${s}`);

    // Competencias únicas ordenadas
    const competencias = [...new Set(items.map((d: any) => (d.competencia as string).trim()))].sort();

    console.log('[Trayectoria] Semestres:', semestresUnicos);
    console.log('[Trayectoria] Competencias:', competencias);

    // Mapa: competencia|semestre → logro
    const logroMap = new Map<string, number>();
    items.forEach((d: any) => {
      const key = `${(d.competencia as string).trim()}|${Number(d.semestre)}`;
      logroMap.set(key, parseFloat(d.logro));
    });

    const colores = [
      { border: '#0A3D91', background: 'rgba(10,61,145,0.1)' },
      { border: '#43a047', background: 'rgba(67,160,71,0.1)' },
      { border: '#e53935', background: 'rgba(229,57,53,0.1)' },
      { border: '#ffb300', background: 'rgba(255,179,0,0.1)' },
      { border: '#00897b', background: 'rgba(0,137,123,0.1)' },
      { border: '#8e24aa', background: 'rgba(142,36,170,0.1)' }
    ];

    this.lineChartData = {
      labels,
      datasets: competencias.map((competencia: string, i: number) => ({
        label: competencia,
        data: semestresUnicos.map((sem: number) => {
          const key = `${competencia}|${sem}`;
          const val = logroMap.get(key);
          return val !== undefined ? val : null;
        }),
        borderColor:     colores[i % colores.length].border,
        backgroundColor: colores[i % colores.length].background,
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: false,
        spanGaps: true
      }))
    };
  }

  private buildEvolucionChart(data: any[]): void {
    const items = Array.isArray(data) ? data : [];
    if (!items.length) { this.evolucionChartData = { labels: [], datasets: [] }; return; }

    const evaluacionesOrdenadas = [...new Map(
      items.map((d: any) => [d.evaluacionId, { id: d.evaluacionId, nombre: d.evaluacionNombre, orden: Number(d.orden) }])
    ).values()].sort((a, b) => a.orden - b.orden);

    const labels = evaluacionesOrdenadas.map(e => e.nombre);
    const competencias = [...new Set(items.map((d: any) => (d.competencia as string).trim()))].sort();

    const logroMap = new Map<string, number>();
    items.forEach((d: any) => {
      const key = `${(d.competencia as string).trim()}|${d.evaluacionId}`;
      logroMap.set(key, parseFloat(d.logro));
    });

    const colores = [
      { border: '#0A3D91', background: 'rgba(10,61,145,0.1)' },   // CD1
      { border: '#43a047', background: 'rgba(67,160,71,0.1)' },   // CD2
      { border: '#e53935', background: 'rgba(229,57,53,0.1)' },   // CD3
      { border: '#ffb300', background: 'rgba(255,179,0,0.1)' },   // CG1
      { border: '#00897b', background: 'rgba(0,137,123,0.1)' },   // CG2
      { border: '#8e24aa', background: 'rgba(142,36,170,0.1)' },  // CP1
      { border: '#546e7a', background: 'rgba(84,110,122,0.1)' },  // CP2
      { border: '#d81b60', background: 'rgba(216,27,96,0.1)' }    // CS
    ];

    this.evolucionChartData = {
      labels,
      datasets: competencias.map((competencia: string, i: number) => ({
        label: competencia,
        data: evaluacionesOrdenadas.map(e => {
          const key = `${competencia}|${e.id}`;
          const val = logroMap.get(key);
          return val !== undefined ? val : null;
        }),
        borderColor: colores[i % colores.length].border,
        backgroundColor: colores[i % colores.length].background,
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0,
        fill: false,
        spanGaps: false
      }))
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISIS IA
  // ═══════════════════════════════════════════════════════════════════════════

  generarAnalisisIA(): void {
    this.iaError = '';
    this.iaResultado = null;
    this.iaCargando = true;

    const raw = this.filtrosForm?.getRawValue?.() || {};
    const carreraObj    = this.carreras.find(c  => String(c.id)  === String(raw.carrera));
    const planObj       = this.planes.find(p    => String(p.id)  === String(raw.plan));
    const asignaturaObj = this.asignaturas.find(a => String(a.id) === String(raw.asignatura));
    const alumnoObj     = this.alumnos.find(a   => String(a.id)  === String(raw.alumno));
    const semestreObj   = this.semestres.find(s => String(s.id)  === String(raw.semestre));

    const ctx = {
      carreraId: raw.carrera,   carreraNombre: carreraObj?.nombre,
      plan: raw.plan,           planNombre: planObj?.nombre,
      asignatura: raw.asignatura, asignaturaNombre: asignaturaObj?.nombre,
      cohorte: raw.cohorte, alumno: raw.alumno, alumnoNombre: alumnoObj?.nombre,
      semestre: raw.semestre, semestreNombre: semestreObj?.nombre
    };

    let payloadChart: any = { chartTitle: this.tituloGrafico };

    if (this.tipoGrafico === 'radar' && this.radarChartData?.labels && this.radarChartData?.datasets) {
      payloadChart = {
        chartTitle: 'Radar: Competencias y Fases del Alumno',
        x: { label: 'Competencias', values: this.radarChartData.labels },
        series: this.radarChartData.datasets.map((ds: any) => ({
          name: ds.label || 'Serie', unit: '%', values: Array.isArray(ds.data) ? ds.data : []
        }))
      };
    } else if (this.tipoGrafico === 'barras' && this.barChartData?.labels && this.barChartData?.datasets) {
      payloadChart = {
        chartTitle: 'Barras: Alumno vs Promedio',
        x: { label: 'Competencias', values: this.barChartData.labels },
        series: this.barChartData.datasets.map((ds: any) => ({
          name: ds.label || 'Serie', unit: '%', values: Array.isArray(ds.data) ? ds.data : []
        }))
      };
    } else if (this.tipoGrafico === 'burbujas' && Array.isArray(this.bubbleRaw) && this.bubbleRaw.length) {
      payloadChart = {
        chartTitle: 'Burbujas: Logro vs. Distancia al Umbral',
        x: { label: 'Competencia', values: this.bubbleRaw.map((d: any) => d.competencia) },
        series: [
          { name: 'Logro (%)',  unit: '%', values: this.bubbleRaw.map((d: any) => Number(d.x)) },
          { name: 'Distancia al umbral (%)', unit: '%', values: this.bubbleRaw.map((d: any) => Number(d.y)) }
        ],
        extra: {
          cumpleUmbral: this.bubbleRaw.map((d: any) => ({ competencia: d.competencia, cumple: d.cumpleUmbral }))
        }
      };
    } else if (this.tipoGrafico === 'heatmap' && this.heatmapData && (this.heatmapData as any).filas && (this.heatmapData as any).competencias) {
      const filas = (this.heatmapData as any).filas;
      const competencias = (this.heatmapData as any).competencias;

      const logroPromedioPorFila = filas.map((fila: any) => {
        const valoresConDatos = competencias
          .map((c: string) => fila.valores?.[c])
          .filter((v: any) => v?.estado === 'con_datos');
        if (!valoresConDatos.length) return { label: fila.label, tipo: fila.tipo, logroPromedio: 0 };
        const promedio = valoresConDatos.reduce((sum: number, v: any) => sum + Number(v.logro), 0) / valoresConDatos.length;
        return { label: fila.label, tipo: fila.tipo, logroPromedio: Math.round(promedio * 10) / 10 };
      });

      const totalAlumnos = filas.filter((f: any) => f.tipo === 'alumno').length;

      payloadChart = {
        chartTitle: `Mapa de Calor: ${this.filtrosForm.value.asignatura} — Desempeño individual por competencia`,
        x: { label: 'Alumno/Asignatura', values: logroPromedioPorFila.map((e: any) => e.label) },
        series: [{ name: 'Logro Promedio (%)', unit: '%', values: logroPromedioPorFila.map((e: any) => e.logroPromedio) }],
        extra: {
          totalAlumnos,
          totalCompetencias: competencias.length,
          resumen: logroPromedioPorFila
        }
      };
    } else if (this.tipoGrafico === 'lineas' && this.lineChartData?.labels && this.lineChartData?.datasets) {
      const competenciaMap = new Map<string, number[]>();
      this.lineChartData.datasets.forEach((ds: any) => {
        competenciaMap.set(ds.label, ds.data);
      });
      payloadChart = {
        chartTitle: 'Trayectoria Académica por Competencia',
        x: { label: 'Semestre', values: this.lineChartData.labels },
        series: Array.from(competenciaMap.entries()).map(([competencia, logros]) => ({
          name: competencia,
          unit: '%',
          values: logros
        }))
      };
    } else if (this.tipoGrafico === 'evolucion' && this.evolucionChartData?.labels && this.evolucionChartData?.datasets) {
      const competenciaMap = new Map<string, number[]>();
      this.evolucionChartData.datasets.forEach((ds: any) => {
        competenciaMap.set(ds.label, ds.data);
      });
      payloadChart = {
        chartTitle: 'Evolución por Evaluación',
        x: { label: 'Evaluación', values: this.evolucionChartData.labels },
        series: Array.from(competenciaMap.entries()).map(([competencia, logros]) => ({
          name: competencia,
          unit: '%',
          values: logros
        }))
      };
    } else if (this.tipoGrafico === 'tramos' && this.distribucionTramosData?.length) {
      payloadChart = {
        chartTitle: 'Competencias del Perfil de Egreso',
        x: { label: 'Competencia', values: this.distribucionTramosData.map((f: any) => f.competencia) },
        series: [
          { name: 'Satisfactorio %', unit: '%', values: this.distribucionTramosData.map((f: any) => Number(f.satisfactorio)) },
          { name: 'Suficiente %', unit: '%', values: this.distribucionTramosData.map((f: any) => Number(f.suficiente)) },
          { name: 'Deficiente %', unit: '%', values: this.distribucionTramosData.map((f: any) => Number(f.deficiente)) }
        ]
      };
    }

    this.analiticaService.generarAnalisisIA({ tipoGrafico: this.tipoGrafico, chart: payloadChart, context: ctx }).subscribe({
      next: (resp) => {
        this.iaResultado = {
          analysis_text:   resp?.analysis_text || '',
          recommendations: Array.isArray(resp?.recommendations) ? resp.recommendations : [],
          alerts:          Array.isArray(resp?.alerts) ? resp.alerts : []
        };
        this.iaCargando = false;
      },
      error: (err) => {
        this.iaError = err?.message || 'Error al generar análisis con IA';
        this.iaCargando = false;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  volverAGeneral(): void {
    const urlActual = this.router.url;
    let rutaDestino: string[];

    if (urlActual.includes('/profesor/')) {
      rutaDestino = ['/profesor', 'analitica', 'general'];
    } else if (urlActual.includes('/jefe-carrera/')) {
      rutaDestino = ['/jefe-carrera', 'analitica', 'general'];
    } else {
      rutaDestino = ['..', '..', 'general'];
    }

    this.router.navigate(rutaDestino, {
      relativeTo: rutaDestino[0].startsWith('/') ? null : this.route
    }).catch(() => {
      this.router.navigate(['..', '..', 'general'], { relativeTo: this.route });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  get tituloGrafico(): string {
    if (this.tipoGrafico === 'radar')     return this.modoCursoActivo ? 'Competencias del Curso' : 'Competencias del Alumno';
    if (this.tipoGrafico === 'barras')    return this.modoCursoActivo ? 'Promedio del Curso' : 'Alumno vs Promedio';
    if (this.tipoGrafico === 'burbujas')  return 'Gráfico de Burbuja — Competencias vs Brecha';
    if (this.tipoGrafico === 'heatmap')   return 'Mapa de Calor del Curso';
    if (this.tipoGrafico === 'lineas')    return 'Trayectoria Académica por Competencia';
    if (this.tipoGrafico === 'evolucion') return 'Evolución por Evaluación';
    if (this.tipoGrafico === 'tramos')    return 'Competencias del Perfil de Egreso';
    return 'Gráfico';
  }

}