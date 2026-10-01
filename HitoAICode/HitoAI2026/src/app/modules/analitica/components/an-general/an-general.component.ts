/**
 * Componente para mostrar análisis general con gráficos de radar, barras y burbujas (miniaturas)
 * CORRECCIONES APLICADAS:
 * 1. guardarFiltros() ahora guarda el formulario COMPLETO (carrera, plan, cohorte, semestre, asignatura, alumno)
 * 2. restaurarFiltrosYGraficos() restaura en orden correcto usando pendingAsignaturaId y pendingAlumnoId
 * 3. updateBubbleChartFromBackend() con colores por competencia y ejes dinámicos
 * 4. goDetalle() guarda filtros completos antes de navegar
 */
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType, Chart } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import { AnaliticaService } from '../../services/analitica.service';
import { InscripcionService, AlumnoCurso } from '../../../../services/inscripcion.service';

@Component({
  selector: 'app-an-general',
  templateUrl: './an-general.component.html',
  styleUrls: ['./an-general.component.css'],
  standalone: false
})
export class AnGeneralComponent implements OnInit, OnDestroy, AfterViewInit {
  filtrosForm!: FormGroup;
  mostrarGraficos = false;
  cargando = false;
  pdfLoading = false;
  dashboardChartsReady = false;
  canExportPdf = false;

  umbralActual: number = 51;
  public readonly ALUMNO_CURSO = '__CURSO__';
  public modoCursoActivo: boolean = false;

  radarLoading = false;
  
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
      const numPoints = scale.getLabels().length;

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2;
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

  radarError: string | null = null;
  radarDataRaw: any[] = [];
  radarFaseDataRaw: any[] = [];
  radarHasData = false;
  radarEmptyMessage = 'No hay datos para el gráfico radar con los filtros seleccionados.';
  radarHasDataByAxis: boolean[] = []; // Array para rastrear qué ejes tienen datos

  // ── HEATMAP ─────────────────────────────────────────────────────────────────
  heatmapLoading = false;
  heatmapError: string | null = null;
  heatmapDataRaw: any[] = [];
  heatmapHasData = false;
  heatmapMatrix: any[] = [];
  heatmapEstudiantes: string[] = [];
  heatmapCompetencias: string[] = [];
  public distribucionTramosData: any[] = [];

  warningActive = false;
  warningMessage = 'Aún no hay ninguna evaluación completa para este curso.';
  asignaturasError: string | null = null;

  carreras: any[] = [];
  planes: any[] = [];
  asignaturas: any[] = [];
  cohortes: any[] = [];
  semestres: any[] = [];
  alumnos: any[] = [];

  // IDs pendientes de re-selección al restaurar (se aplican cuando llegan las listas)
  private pendingAsignaturaId: string | null = null;
  private pendingAlumnoId: string | null = null;

  alumnosCurso: AlumnoCurso[] = [];
  alumnoSeleccionado: AlumnoCurso | null = null;

  // ── RADAR ─────────────────────────────────────────────────────────────────
  public radarChartType = 'radar' as const;
  public radarChartData: ChartData<'radar'> = { labels: [], datasets: [] };
  public radarChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title:  { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const dataIndex = ctx.dataIndex;
            const hasData = this.radarHasDataByAxis[dataIndex] ?? true;
            if (!hasData) {
              return 'Sin datos disponibles para esta competencia';
            }
            return ` ${ctx.dataset.label}: ${ctx.parsed.r ?? 0}%`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20, font: { size: 10 }, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.1)' },
        pointLabels: { display: false, callback: () => '' } as any
      }
    }
  };

  // ── BARRAS ────────────────────────────────────────────────────────────────
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y ?? 0}%`
        }
      }
    },
    scales: {
      x: {
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
        min: 0,
        max: 100,
        ticks: {
          callback: (v: any) => v + '%',
          font: { size: 11 }
        },
        grid: { color: 'rgba(0,0,0,0.06)' }
      }
    }
  };

  // ── BARRAS MINIATURA (Thumbnail) ───────────────────────────────────────────
  public barChartOptionsMini: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: {
      padding: { top: 4, bottom: 4, left: 4, right: 4 }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          display: true,
          font: { size: 9 },
          stepSize: 25,
          callback: (v: any) => v + '%'
        },
        border: { display: false }
      }
    }
  };

  // ── BURBUJAS ──────────────────────────────────────────────────────────────
  public bubbleChartType = 'bubble' as const;
  public bubbleChartData: ChartData<'bubble'> = { datasets: [] };
  public bubbleChartOptions: ChartConfiguration<'bubble'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },  // Sin leyenda en miniatura
      title:  { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: any) => (items[0].raw as any).competencia || 'Competencia',
          label: (ctx: any) => {
            const d = ctx.raw as any;
            return [`Logro: ${d.xOriginal || d.x}%`, `Distancia al umbral: ${d.y >= 0 ? '+' : ''}${d.y}%`, `Cumple umbral: ${d.cumpleUmbral ? 'Sí' : 'No'}`, `Indicadores que la miden: ${d.pesoReal}`];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true, text: 'Logro (%)',
          font: { size: 11, weight: 'bold' }, color: '#0A3D91'
        },
        min: -5, max: 105,
        ticks: { stepSize: 10, font: { size: 10 }, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.08)' }
      },
      y: {
        title: {
          display: true, text: 'Distancia al Umbral (%)',
          font: { size: 11, weight: 'bold' }, color: '#0A3D91'
        },
        min: undefined, max: undefined,
        ticks: { stepSize: 10, font: { size: 10 }, color: '#666' },
        grid: { color: 'rgba(0,0,0,0.08)' }
      }
    }
  };

  // ── LÍNEAS ────────────────────────────────────────────────────────────────
  public lineChartType = 'line' as const;
  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true,
    plugins: {
      legend: { display: false },  // Sin leyenda en miniatura
      title:  { display: false }
    },
    scales: {
      y: {
        display: true,
        min: 0,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          display: true,
          font: { size: 9 },
          stepSize: 25,
          callback: (v: any) => v + '%'
        },
        border: { display: false }
      },
      x: {
        display: false
      }
    }
  };

  // ── EVOLUCIÓN ────────────────────────────────────────────────────────────────
  public evolucionChartType = 'line' as const;
  public evolucionChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public evolucionChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        display: true,
        min: 0,
        max: 100,
        grid: { display: true, color: 'rgba(0,0,0,0.05)' },
        ticks: { display: true, font: { size: 9 }, stepSize: 10, callback: (v: any) => v + '%' },
        border: { display: false }
      },
      x: { display: false }
    }
  };

  @ViewChildren(BaseChartDirective) chartDirs!: QueryList<BaseChartDirective>;

  constructor(
    private fb: FormBuilder,
    private analiticaService: AnaliticaService,
    private inscripcionService: InscripcionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CICLO DE VIDA
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    console.log('=== [AnGeneral] Componente Iniciado ===');
    const urlActual = this.router.url;
    const esNavegacionExterna = this.analiticaService.esNavegacionExterna(urlActual);

    if (esNavegacionExterna) {
      console.log('[AnGeneral] Ingreso desde módulo externo → limpiando estado');
      this.analiticaService.limpiarTodo();
    } else {
      console.log('[AnGeneral] Regreso desde detalle → conservando filtros');
    }

    this.inicializarFormulario();
    this.cargarDatosFiltros();

    if (!esNavegacionExterna) {
      this.restaurarFiltrosYGraficos();
    }

    this.analiticaService.registrarUrlAnalitica(urlActual);
  }

  ngOnDestroy(): void {
    this.analiticaService.registrarUrlAnalitica(this.router.url);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateExportState(), 0);
    this.chartDirs?.changes?.subscribe(() => this.updateExportState());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMULARIO Y FILTROS
  // ═══════════════════════════════════════════════════════════════════════════

  inicializarFormulario(): void {
    this.filtrosForm = this.fb.group({
      carrera:    ['', Validators.required],
      plan:       [{ value: '', disabled: true }, Validators.required],
      cohorte:    [{ value: '', disabled: true }, Validators.required],
      semestre:   [{ value: '', disabled: true }, Validators.required],
      asignatura: [{ value: '', disabled: true }, Validators.required],
      alumno:     [{ value: '', disabled: true }, Validators.required]
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
          planCtrl?.enable({ emitEvent: false });
        });
      } else {
        this.planes = [];
        planCtrl?.setValue('');
        planCtrl?.disable();
      }
    });

    this.filtrosForm.get('plan')?.valueChanges.subscribe(planId => {
      const cohorteCtrl = this.filtrosForm.get('cohorte');
      if (planId) {
        cohorteCtrl?.enable({ emitEvent: false });
      } else {
        cohorteCtrl?.setValue('', { emitEvent: false });
        cohorteCtrl?.disable({ emitEvent: false });
      }
      this.loadAsignaturasAndReset();
    });

    this.filtrosForm.get('cohorte')?.valueChanges.subscribe(cohorteVal => {
      const semestreCtrl = this.filtrosForm.get('semestre');
      if (cohorteVal) {
        semestreCtrl?.enable({ emitEvent: false });
      } else {
        semestreCtrl?.setValue('', { emitEvent: false });
        semestreCtrl?.disable({ emitEvent: false });
      }
      this.loadAlumnosAndReset();
    });

    this.filtrosForm.get('semestre')?.valueChanges.subscribe(() => this.loadAsignaturasAndReset());
    this.filtrosForm.get('asignatura')?.valueChanges.subscribe(() => this.loadAlumnosAndReset());
  }

  private loadAsignaturasAndReset(): void {
    const asignaturaCtrl = this.filtrosForm.get('asignatura');
    this.asignaturas = [];
    this.alumnos = [];
    this.filtrosForm.patchValue({ asignatura: null, alumno: null }, { emitEvent: false });
    this.asignaturasError = null;

    const plan     = this.filtrosForm.value.plan     as number | null;
    const semestre = this.filtrosForm.value.semestre as number | null;

    if (!plan || !semestre) {
      asignaturaCtrl?.disable({ emitEvent: false });
      this.filtrosForm.get('alumno')?.disable({ emitEvent: false });
      return;
    }

    this.analiticaService.getAsignaturasPorSemestre(plan, semestre).subscribe({
      next: (data) => {
        this.asignaturas = data || [];
        asignaturaCtrl?.enable({ emitEvent: false });

        // Resetear si el valor actual ya no está en la nueva lista
        const actual = this.filtrosForm.value.asignatura;
        if (actual && !this.asignaturas.some(a => String(a.id) === String(actual))) {
          this.filtrosForm.patchValue({ asignatura: null }, { emitEvent: false });
        }

        // ✅ Aplicar asignatura pendiente si existe en la lista recién cargada
        if (this.pendingAsignaturaId) {
          const existe = this.asignaturas.some(a => String(a.id) === String(this.pendingAsignaturaId));
          if (existe) {
            this.filtrosForm.get('asignatura')?.setValue(this.pendingAsignaturaId, { emitEvent: true });
            this.pendingAsignaturaId = null;
          }
        }
      },
      error: (err) => {
        this.asignaturas = [];
        this.asignaturasError = err?.message || 'No se pudieron cargar las asignaturas.';
        asignaturaCtrl?.enable({ emitEvent: false });
      }
    });
  }

  private loadAlumnosAndReset(): void {
    this.alumnos = [];
    this.alumnosCurso = [];
    this.alumnoSeleccionado = null;
    const alumnoCtrl = this.filtrosForm.get('alumno');
    this.filtrosForm.patchValue({ alumno: null }, { emitEvent: false });

    const asignatura = this.filtrosForm.value.asignatura as string | null;
    const cohorte = this.filtrosForm.value.cohorte;
    if (asignatura) {
      alumnoCtrl?.enable({ emitEvent: false });
      this.cargarAlumnosCurso(asignatura, cohorte);
    } else {
      alumnoCtrl?.disable({ emitEvent: false });
    }
  }

  cargarAlumnosCurso(idAsignatura: string, cohorte?: any): void {
    this.inscripcionService.getAlumnosPorCurso(idAsignatura, cohorte).subscribe({
      next: (alumnos) => {
        this.alumnosCurso = alumnos;
        console.log('[AnGeneral] 📚 alumnosCurso recibidos del backend:', JSON.stringify(alumnos, null, 2));
        this.alumnoSeleccionado = null;

        // ✅ Aplicar alumno pendiente si existe en la lista recién cargada
        if (this.pendingAlumnoId === this.ALUMNO_CURSO) {
          const semestreForm = Number(this.filtrosForm.value.semestre);
          const cohorteForm = Number(this.filtrosForm.value.cohorte);
          this.alumnoSeleccionado = {
            idEstudiante: this.ALUMNO_CURSO,
            nombre: 'Curso',
            apellido: 'Completo',
            anio: cohorteForm,
            semestre: semestreForm
          } as AlumnoCurso;
          this.filtrosForm.get('alumno')?.setValue(this.ALUMNO_CURSO, { emitEvent: false });
          this.pendingAlumnoId = null;
        } else if (this.pendingAlumnoId) {
          const match = this.alumnosCurso.find(a => a.idEstudiante === this.pendingAlumnoId);
          if (match) {
            this.filtrosForm.get('alumno')?.setValue(this.pendingAlumnoId, { emitEvent: true });
            this.alumnoSeleccionado = match;
            this.pendingAlumnoId = null;
          }
        }
      },
      error: () => { this.alumnosCurso = []; }
    });
  }

  onAlumnoChange(id: string): void {
    if (id === this.ALUMNO_CURSO) {
      const semestreForm = Number(this.filtrosForm.value.semestre);
      const cohorteForm = Number(this.filtrosForm.value.cohorte);
      this.alumnoSeleccionado = {
        idEstudiante: this.ALUMNO_CURSO,
        nombre: 'Curso',
        apellido: 'Completo',
        anio: cohorteForm,
        semestre: semestreForm
      } as AlumnoCurso;
      return;
    }
    this.alumnoSeleccionado = this.alumnosCurso.find(a => a.idEstudiante === id) || null;
  }

  public reintentarCargarAsignaturas(): void {
    this.loadAsignaturasAndReset();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESTAURAR FILTROS Y GRÁFICOS (al volver desde detalle)
  // ═══════════════════════════════════════════════════════════════════════════

  restaurarFiltrosYGraficos(): void {
    console.log('[AnGeneral] 🔄 Restaurando filtros...');

    const hayQueryParams      = Object.keys(this.route.snapshot.queryParams).length > 0;
    const hayFiltrosEnServicio = this.analiticaService.tieneFiltros();

    if (!hayQueryParams && !hayFiltrosEnServicio) {
      console.log('[AnGeneral] ℹ️ No hay filtros para restaurar');
      return;
    }

    let f = this.analiticaService.obtenerFiltros();

    if (!hayFiltrosEnServicio && hayQueryParams) {
      f = { ...this.route.snapshot.queryParams };
      this.analiticaService.guardarFiltros(f);
    }

    const valido = Object.keys(f).length > 0 &&
                   Object.values(f).some(v => v !== null && v !== undefined && v !== '');
    if (!valido) return;

    console.log('[AnGeneral] ✅ Filtros a restaurar:', f);

    // Al volver desde el detalle, todos los filtros quedan libres (sin cascada bloqueante)
    ['plan', 'cohorte', 'semestre', 'asignatura', 'alumno'].forEach(name =>
      this.filtrosForm.get(name)?.enable({ emitEvent: false })
    );

    // Guardar IDs que dependen de listas asíncronas
    this.pendingAsignaturaId = f.asignatura ? String(f.asignatura) : null;
    this.pendingAlumnoId     = f.alumno     ? String(f.alumno)     : null;

    setTimeout(() => {
      // 1. Carrera (dispara carga de planes)
      if (f.carrera) {
        this.filtrosForm.get('carrera')?.setValue(f.carrera, { emitEvent: true });
      }

      // 2. Cohorte (independiente)
      if (f.cohorte) {
        this.filtrosForm.get('cohorte')?.setValue(f.cohorte, { emitEvent: false });
      }

      // 3. Cuando los planes lleguen, setear plan y semestre
      if (f.carrera) {
        this.analiticaService.getPlanes(f.carrera).subscribe(planes => {
          this.planes = planes;
          const planCtrl = this.filtrosForm.get('plan');
          planCtrl?.enable({ emitEvent: false });

          if (f.plan) planCtrl?.setValue(f.plan, { emitEvent: true });

          // 4. Semestre → dispara loadAsignaturasAndReset → que aplicará pendingAsignaturaId
          if (f.semestre) {
            this.filtrosForm.get('semestre')?.setValue(f.semestre, { emitEvent: true });
          }

          // 5. Restaurar gráficos desde caché
          this.intentarRestaurarGraficos();
        });
      } else {
        this.intentarRestaurarGraficos();
      }
    }, 300);
  }

  /** Intenta mostrar gráficos cacheados. Si no hay, no hace nada (usuario debe regenerar). */
  private intentarRestaurarGraficos(): void {
    const datosRadar    = this.analiticaService.obtenerDatosGraficos('radar');
    const datosBarras   = this.analiticaService.obtenerDatosGraficos('barras');
    const datosBurbujas = this.analiticaService.obtenerDatosGraficos('burbujas');
    const datosHeatmap  = this.analiticaService.obtenerDatosGraficos('heatmap');
    const datosLineas   = this.analiticaService.obtenerDatosGraficos('lineas');
    const datosEvolucion = this.analiticaService.obtenerDatosGraficos('evolucion');
    const datosTramos = this.analiticaService.obtenerDatosGraficos('tramos');

    if (datosRadar && datosBarras) {
      console.log('[AnGeneral] 📊 Restaurando gráficos desde caché...');

      // Manejar formato dual { competencia, fase } o formato legacy { labels, datasets }
      if (datosRadar?.competencia) {
        this.radarChartData = datosRadar.competencia;
      } else {
        this.radarChartData = datosRadar;
      }

      // Reconstruir radarDataRaw y radarFaseDataRaw desde el ChartData cacheado,
      // ya que buildChartsPayload() depende de estos arrays crudos, no de radarChartData
      const labelsComp = this.radarChartData?.labels || [];
      const dataComp   = this.radarChartData?.datasets?.[0]?.data || [];
      this.radarDataRaw = labelsComp.map((nombre: any, i: number) => ({ nombre, valor: dataComp[i] }));

      if (datosRadar?.fase) {
        const labelsFase = datosRadar.fase?.labels || [];
        const dataFase   = datosRadar.fase?.datasets?.[0]?.data || [];
        this.radarFaseDataRaw = labelsFase.map((nombre: any, i: number) => ({ nombre, valor: dataFase[i] }));
      } else {
        this.radarFaseDataRaw = [];
      }

      this.radarHasData = (this.radarChartData?.datasets?.[0]?.data?.length || 0) > 0;
      this.barChartData = datosBarras?.chartData ?? datosBarras;
      this.modoCursoActivo = !!(datosBarras?.modoCurso);

      if (datosBurbujas) {
        // datosBurbujas puede ser el array raw o el ChartData ya construido
        if (Array.isArray(datosBurbujas)) {
          // Formato viejo (compatibilidad): array plano, sin umbral guardado, usar default 51
          this.umbralActual = 51;
          this.updateBubbleChartFromBackend(datosBurbujas);
        } else if (datosBurbujas.items) {
          // Formato nuevo: objeto con items y umbral
          this.umbralActual = datosBurbujas.umbral ?? 51;
          this.updateBubbleChartFromBackend(datosBurbujas.items);
        } else {
          this.bubbleChartData = datosBurbujas;
        }
      }
      
      // Restaurar umbral desde caché de burbujas antes de procesar radar
      if (datosBurbujas?.umbral) {
        this.umbralActual = datosBurbujas.umbral;
      }

      if (datosHeatmap) {
        this.heatmapDataRaw = datosHeatmap;
        this.processHeatmapDataCurso(datosHeatmap);
      }

      if (datosLineas) {
        if (Array.isArray(datosLineas)) {
          this.updateLineChartFromBackend(datosLineas);
        } else {
          this.lineChartData = datosLineas;
        }
      }

      if (datosEvolucion) {
        if (Array.isArray(datosEvolucion)) {
          this.updateEvolucionChartFromBackend(datosEvolucion);
        } else {
          this.evolucionChartData = datosEvolucion;
        }
      }

      if (datosTramos) {
        this.distribucionTramosData = datosTramos?.filas || [];
      }

      this.radarError    = null;
      this.radarLoading  = false;
      this.warningActive = false;
      setTimeout(() => {
        this.mostrarGraficos = true;
        this.updateExportState();
        this.cdr.detectChanges();
      }, 0);
      console.log('[AnGeneral] 🎉 Gráficos restaurados exitosamente');
    } else {
      console.log('[AnGeneral] ⚠️ No hay gráficos en caché — el usuario deberá presionar Generar Análisis');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERAR ANÁLISIS
  // ═══════════════════════════════════════════════════════════════════════════

  generarAnalisis(): void {
    this.warningActive = false;
    this.warningMessage = 'Aún no hay ninguna evaluación completa para este curso.';

    const rawValues = this.filtrosForm.getRawValue();
    const camposVacios = Object.entries(rawValues).filter(([, v]) => !v || v === '');
    if (camposVacios.length > 0) {
      alert('Por favor completa todos los filtros');
      return;
    }

    // Sincronizar alumnoSeleccionado
    const idAlumnoForm = String(rawValues.alumno);
    if (idAlumnoForm === this.ALUMNO_CURSO) {
      const semestreForm = Number(this.filtrosForm.value.semestre);
      const cohorteForm = Number(this.filtrosForm.value.cohorte);
      this.alumnoSeleccionado = {
        idEstudiante: this.ALUMNO_CURSO,
        nombre: 'Curso',
        apellido: 'Completo',
        anio: cohorteForm,
        semestre: semestreForm
      } as AlumnoCurso;
    } else if (!this.alumnoSeleccionado || this.alumnoSeleccionado.idEstudiante !== idAlumnoForm) {
      this.alumnoSeleccionado = this.alumnosCurso.find(a => a.idEstudiante === idAlumnoForm) || null;
    }

    if (!this.alumnoSeleccionado) {
      alert('Selecciona un alumno para generar el análisis.');
      return;
    }

    console.log('[AnGeneral] 👤 alumnoSeleccionado completo antes de construir filtrosBackend:', JSON.stringify(this.alumnoSeleccionado, null, 2));

    // "Congelar" el modo Curso solo al presionar Generar Análisis
    this.modoCursoActivo = this.alumnoSeleccionado.idEstudiante === this.ALUMNO_CURSO;

    const filtrosBackend = {
      asignatura: this.filtrosForm.value.asignatura as string,
      alumno:     this.alumnoSeleccionado.idEstudiante,
      anio:       this.alumnoSeleccionado.anio,
      semestre:   this.alumnoSeleccionado.semestre
    };

    // Filtros para heatmap (sin alumno, ya que muestra todos los estudiantes)
    const filtrosHeatmapCurso = {
      asignatura: this.filtrosForm.value.asignatura,
      anio: this.alumnoSeleccionado?.anio ?? this.filtrosForm.value.cohorte,
      semestre: this.filtrosForm.value.semestre
    };

    // Filtros para trayectoria (solo alumno, muestra toda su carrera)
    const filtrosLineas = {
      alumno: this.alumnoSeleccionado.idEstudiante
    };

    // ✅ Guardar filtros COMPLETOS del formulario (no solo los del backend)
    //    Para que al volver desde detalle se puedan restaurar carrera, plan, cohorte, etc.
    const filtrosCompletos = {
      ...rawValues,
      // Mantener semestre y cohorte del formulario para restaurar UI
      semestrePlan: rawValues.semestre,
      // Guardar valores reales del alumno para el backend
      anioReal:     this.alumnoSeleccionado.anio,
      semestreReal: this.alumnoSeleccionado.semestre,
      // Guardar nombre del alumno para mostrar en dropdown
      alumnoNombre: `${this.alumnoSeleccionado.nombre} ${this.alumnoSeleccionado.apellido}`
    };
    this.analiticaService.guardarFiltros(filtrosCompletos);

    console.log('[AnGeneral] 🚀 Generando análisis:', filtrosBackend);
    this.cargando = true;
    this.mostrarGraficos = false;

    // Consultar umbral de la asignatura ANTES de generar gráficos
    this.analiticaService.getUmbralAsignatura(this.filtrosForm.value.asignatura).subscribe({
      next: (resp) => {
        this.umbralActual = resp?.Umbral ?? 51;
        this.ejecutarCadenaDeAnalisis(filtrosBackend, filtrosHeatmapCurso, filtrosLineas);
      },
      error: () => {
        this.umbralActual = 51;
        this.ejecutarCadenaDeAnalisis(filtrosBackend, filtrosHeatmapCurso, filtrosLineas);
      }
    });
  }

  private ejecutarCadenaDeAnalisis(filtrosBackend: any, filtrosHeatmapCurso: any, filtrosLineas: any): void {
    // ── Radar ────────────────────────────────────────────────────────────────
    forkJoin({
      competencia: this.analiticaService.getRadarCompetencias(filtrosBackend),
      fase: this.analiticaService.getRadarCompetencias({...filtrosBackend}, 'fase')
    }).subscribe({
      next: ({ competencia, fase }: any) => {
        if (!Array.isArray(competencia) && (competencia as any)?.error === 'curso_pendiente') {
          this.mostrarAdvertencia((competencia as any)?.mensaje);
          return;
        }

        // Construir radarChartData (para miniatura en general)
        this.updateRadarChart(competencia);

        // Construir radarFaseChartData para el caché dual
        const radarFaseData = {
          labels: fase.map((d: any) => d.nombre),
          datasets: [{
            label: 'Logro por fase',
            data: fase.map((d: any) => Number(d.valor ?? 0)),
            backgroundColor: 'rgba(10, 61, 145, 0.2)',
            borderColor: '#0A3D91',
            borderWidth: 2,
            pointBackgroundColor: fase.map((d: any) =>
              Number(d.valor) < this.umbralActual ? '#e53935' : '#0A3D91'
            ),
            pointBorderColor: '#fff',
            pointRadius: 6,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#0A3D91'
          }]
        };

        this.radarFaseDataRaw = Array.isArray(fase) ? fase : [];

        // Guardar formato DUAL para que an-especifico pueda restaurar ambos
        this.analiticaService.guardarDatosGraficos('radar', {
          competencia: this.radarChartData,
          fase: radarFaseData,
          modoCurso: filtrosBackend.alumno === this.ALUMNO_CURSO
        });

        this.cdr.detectChanges();

        // ── Barras ──────────────────────────────────────────────────────────
        this.analiticaService.getBarrasComparativa(filtrosBackend).subscribe({
          next: (data: any) => {
            console.log('[Barras] ✅ Datos recibidos:', data);

            const labels = data.labels ?? [];

            if (data.modo === 'curso') {
              const cursoValues = data.series?.[0]?.values ?? [];
              this.barChartData = {
                labels: labels,
                datasets: [
                  {
                    label: '% Alumnos que cumplen umbral',
                    data: cursoValues,
                    backgroundColor: '#1B3B6F',
                    borderRadius: 4,
                    barPercentage: 0.75,
                    categoryPercentage: 0.8
                  }
                ]
              };
            } else {
              const promedioValues = data.series?.find((s: any) => s.name === 'Promedio General')?.values ?? [];
              const alumnoValues   = data.series?.find((s: any) => s.name === 'Alumno')?.values ?? [];

              this.barChartData = {
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

            const barrasModoCursoTmp = data.modo === 'curso';
            const numCumpleTmp = data.extra?.numCumple ?? [];
            const numNoCumpleTmp = data.extra?.numNoCumple ?? [];
            const barrasCountsTmp = labels.map((_: any, i: number) => ({
              cumple: numCumpleTmp[i] ?? 0,
              noCumple: numNoCumpleTmp[i] ?? 0
            }));
            this.analiticaService.guardarDatosGraficos('barras', {
              chartData: this.barChartData,
              modoCurso: barrasModoCursoTmp,
              counts: barrasCountsTmp
            });
            this.cdr.detectChanges();

            // ── Burbujas ────────────────────────────────────────────────────
            this.analiticaService.getBurbujas(filtrosBackend).subscribe({
              next: (datosBurbujas) => {
                if (!datosBurbujas || (datosBurbujas as any)?.error === 'curso_pendiente') {
                  this.mostrarAdvertencia((datosBurbujas as any)?.mensaje);
                  return;
                }
                const items = datosBurbujas.items || [];
                const umbralAsignatura = datosBurbujas.umbral ?? 51;
                this.umbralActual = umbralAsignatura;
                this.updateBubbleChartFromBackend(items);
                this.analiticaService.guardarDatosGraficos('burbujas', { items, umbral: umbralAsignatura });
                this.cdr.detectChanges();

                // ── Heatmap ─────────────────────────────────────────────────────
                this.analiticaService.getHeatmapCurso(filtrosHeatmapCurso).subscribe({
                  next: (datosHeatmap) => {
                    this.heatmapDataRaw = datosHeatmap;
                    this.processHeatmapDataCurso(datosHeatmap);
                    this.analiticaService.guardarDatosGraficos('heatmap', datosHeatmap);
                    this.cdr.detectChanges();

                    // ── Líneas ─────────────────────────────────────────────────────
                    if (filtrosBackend.alumno === this.ALUMNO_CURSO) {
                      this.lineChartData = { labels: [], datasets: [] };
                      this.cdr.detectChanges();
                      this.cargarDistribucionTramos(filtrosBackend);
                    } else {
                      this.analiticaService.getLineas(filtrosLineas).subscribe({
                        next: (datosLineas) => {
                          this.updateLineChartFromBackend(datosLineas);
                          this.analiticaService.guardarDatosGraficos('lineas', datosLineas);
                          this.cdr.detectChanges();
                          this.cargarDistribucionTramos(filtrosBackend);
                        },
                        error: (err) => {
                          console.error('[AnGeneral] ❌ Error líneas:', err);
                          this.cargarDistribucionTramos(filtrosBackend);
                        }
                      });
                    }
                  },
                  error: (err) => {
                    console.error('[AnGeneral] ❌ Error heatmap:', err);
                    this.heatmapError = err?.message || 'Error al cargar datos del heatmap';
                    // No bloquear la visualización de otros gráficos si falla el heatmap
                    setTimeout(() => {
                      this.mostrarGraficos = true;
                      this.cargando = false;
                      this.updateExportState();
                      this.cdr.detectChanges();
                    }, 0);
                  }
                });
              },
              error: (err) => {
                console.error('[AnGeneral] ❌ Error burbujas:', err);
                this.cargando = false;
                setTimeout(() => {
                  this.mostrarGraficos = true; // Mostrar radar y barras aunque fallen burbujas
                  this.updateExportState();
                  this.cdr.detectChanges();
                }, 0);
              }
            });
          },
          error: (err) => {
            console.error('[AnGeneral] ❌ Error barras:', err);
            this.cargando = false;
            alert('Error al cargar datos de barras.');
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        console.error('[AnGeneral] ❌ Error radar:', err);
        if (err?.status === 409 || err?.payload?.error === 'curso_pendiente') {
          this.mostrarAdvertencia(err?.payload?.mensaje || err?.message);
          return;
        }
        this.cargando = false;
        alert('Error al cargar datos de radar.');
        this.cdr.detectChanges();
      }
    });
  }

  private mostrarAdvertencia(mensaje?: string): void {
    this.warningActive  = true;
    this.warningMessage = mensaje || this.warningMessage;
    this.mostrarGraficos = false;
    this.cargando = false;
    this.updateExportState();
    this.cdr.detectChanges();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTUALIZAR GRÁFICOS
  // ═══════════════════════════════════════════════════════════════════════════

  private updateRadarChart(data: any[]): void {
    this.radarDataRaw = Array.isArray(data) ? data : [];
    
    // Definir los 8 ejes institucionales en orden fijo
    const ejesInstitucionales = ['CD1', 'CD2', 'CD3', 'CG1', 'CG2', 'CP1', 'CP2', 'CS'];
    
    // Mapear datos del backend a un diccionario por nombre de competencia
    const datosPorCompetencia = new Map<string, number>();
    this.radarDataRaw.forEach(d => {
      const codigoCorto = String(d.nombre).split('·')[0].trim();
      datosPorCompetencia.set(codigoCorto, Number(d.valor ?? 0));
    });
    
    // Construir arrays para labels, data, y hasData en el orden institucional
    const labels: string[] = [];
    const dataArray: number[] = [];
    const hasData: boolean[] = [];
    const pointColors: string[] = [];
    
    ejesInstitucionales.forEach(eje => {
      labels.push(eje);
      const valor = datosPorCompetencia.get(eje);
      if (valor !== undefined) {
        dataArray.push(valor);
        hasData.push(true);
        pointColors.push(valor < this.umbralActual ? '#e53935' : '#0A3D91');
      } else {
        dataArray.push(0); // Valor placeholder para mantener la forma del radar
        hasData.push(false);
        pointColors.push('#999999'); // Gris para ejes sin datos
      }
    });
    
    this.radarChartData = {
      labels: labels,
      datasets: [{
        label: 'Porcentaje de logro',
        data: dataArray,
        backgroundColor: 'rgba(10,61,145,0.2)',
        borderColor: '#0A3D91',
        borderWidth: 2,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#fff',
        pointRadius: 6,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#0A3D91'
      }]
    };
    this.radarHasDataByAxis = hasData; // Guardar metadata en el componente
    this.radarHasData = true; // Siempre true porque mostramos todos los ejes
  }

  private updateBarChartFromBackend(data: any): void {
    if (!data || !data.labels || !data.series) {
      this.barChartData = { labels: [], datasets: [] };
      return;
    }

    const labels = data.labels;
    const promedioValues = data.series.find((s: any) => s.name === 'Promedio General')?.values ?? [];
    const alumnoValues = data.series.find((s: any) => s.name === 'Alumno')?.values ?? [];

    this.barChartData = {
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

  private updateBubbleChartFromBackend(data: any[]): void {
    const items = Array.isArray(data) ? data : [];
    if (!items.length) { this.bubbleChartData = { datasets: [] }; return; }

    // Calcular array completo de pesos curriculares para escalado dinámico
    const pesosCurriculares = items.map((d: any) => Number(d.r));
    
    const escalarR = (valor: number, valores: number[]): number => {
      const minR = 8;
      const maxR = 28;
      const minVal = Math.min(...valores);
      const maxVal = Math.max(...valores);

      if (minVal === maxVal) {
        // Todos los pesos son iguales, usar radio intermedio fijo
        return (minR + maxR) / 2;
      }

      // Interpolación por ÁREA (radio al cuadrado), no por radio directo.
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

    const bubbleDatasets = items.map((d: any, i: number) => {
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
          pesoReal: pesoReal // Usar el valor original guardado
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

    // Ajustar ejes dinámicamente (distancia al umbral puede ser negativa)
    const distancias = items.map((d: any) => Number(d.y));
    const minDistancia = Math.min(...distancias);
    const maxDistancia = Math.max(...distancias);
    const paddingY = Math.max(10, Math.abs(maxDistancia - minDistancia) * 0.1);

    const logros = items.map((d: any) => Number(d.x));
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

  private updateLineChartFromBackend(data: any[]): void {
    const items = Array.isArray(data) ? data : [];
    if (!items.length) { this.lineChartData = { labels: [], datasets: [] }; return; }

    // Eje X: semestres únicos ordenados
    const semestresUnicos = [...new Set(items.map((d: any) => Number(d.semestre)))]
      .sort((a, b) => a - b);
    const labels = semestresUnicos.map(s => `Semestre ${s}`);

    // Competencias únicas
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

  private updateEvolucionChartFromBackend(data: any[]): void {
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

    const paletaCompetencias: Record<string, string> = {
      CD1: '#1E88E5', CD2: '#43A047', CD3: '#FB8C00', CG1: '#8E24AA',
      CG2: '#00ACC1', CP1: '#D81B60', CP2: '#FDD835', CS: '#6D4C41'
    };
    const colorPorCompetencia = (competenciaTexto: string): string => {
      const codigo = String(competenciaTexto).split('·')[0].trim();
      return paletaCompetencias[codigo] || '#999999';
    };

    this.evolucionChartData = {
      labels,
      datasets: competencias.map((competencia: string) => {
        const color = colorPorCompetencia(competencia);
        return {
          label: competencia,
          data: evaluacionesOrdenadas.map(e => {
            const key = `${competencia}|${e.id}`;
            const val = logroMap.get(key);
            return val !== undefined ? val : null;
          }),
          borderColor: color,
          backgroundColor: color + '1a',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0,
          fill: false,
          spanGaps: false
        };
      })
    };
  }

  private finalizarConEvolucion(filtrosBackend: any): void {
    this.analiticaService.getEvolucionEvaluacion(filtrosBackend).subscribe({
      next: (datosEvolucion) => {
        this.updateEvolucionChartFromBackend(datosEvolucion);
        this.analiticaService.guardarDatosGraficos('evolucion', datosEvolucion);
        this.finalizarAnalisis();
      },
      error: (err) => {
        console.error('[AnGeneral] ❌ Error evolución:', err);
        this.evolucionChartData = { labels: [], datasets: [] };
        this.finalizarAnalisis();
      }
    });
  }

  private cargarDistribucionTramos(filtrosBackend: any): void {
    this.analiticaService.getDistribucionTramos(filtrosBackend).subscribe({
      next: (data) => {
        this.distribucionTramosData = data?.filas || [];
        this.analiticaService.guardarDatosGraficos('tramos', data);
        this.finalizarConEvolucion(filtrosBackend);
      },
      error: (err) => {
        console.error('[AnGeneral] ❌ Error distribución por tramos:', err);
        this.distribucionTramosData = [];
        this.finalizarConEvolucion(filtrosBackend);
      }
    });
  }

  private finalizarAnalisis(): void {
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarGraficos = true;
      this.cargando = false;
      this.updateExportState();
      this.cdr.detectChanges();
    }, 0);
  }

  // ── HEATMAP ────────────────────────────────────────────────────────────────
  
  /**
   * Procesa los datos del heatmap-curso para crear la matriz de visualización
   */
  private processHeatmapDataCurso(data: any): void {
    if (!data || !Array.isArray(data.filas) || !Array.isArray(data.competencias)) {
      this.heatmapHasData = false;
      this.heatmapMatrix = [];
      this.heatmapEstudiantes = [];
      this.heatmapCompetencias = [];
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

    this.heatmapHasData = true;
    console.log('[AnGeneral] ✅ Heatmap-curso procesado:', { filas: this.heatmapMatrix.length, competencias: this.heatmapCompetencias.length });
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

  /**
   * Obtiene el color de texto basado en el brillo real del fondo (claro/oscuro)
   */
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
    if (celda.estado === 'sin_evaluar') return 'Pend.';
    return celda.logro !== null ? String(celda.logro) : '-';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVEGACIÓN A DETALLE
  // ═══════════════════════════════════════════════════════════════════════════

  goDetalle(grafico: 'radar' | 'barras' | 'burbujas' | 'heatmap' | 'lineas' | 'evolucion' | 'tramos'): void {
    // ✅ Guardar filtros COMPLETOS antes de navegar al detalle
    const filtrosCompletos = this.filtrosForm.getRawValue();
    if (this.alumnoSeleccionado) {
      // Mantener semestre del formulario para restaurar UI
      filtrosCompletos['semestrePlan'] = filtrosCompletos.semestre;
      // Guardar valores reales del alumno para el backend
      filtrosCompletos['anioReal']     = this.alumnoSeleccionado.anio;
      filtrosCompletos['semestreReal'] = this.alumnoSeleccionado.semestre;
      // Guardar nombre del alumno para mostrar en dropdown
      filtrosCompletos['alumnoNombre'] = `${this.alumnoSeleccionado.nombre} ${this.alumnoSeleccionado.apellido}`;
    }
    this.analiticaService.guardarFiltros(filtrosCompletos);

    const queryParams: any = {};
    Object.keys(filtrosCompletos).forEach(key => {
      const v = filtrosCompletos[key];
      if (v !== null && v !== undefined && v !== '') {
        queryParams[key] = typeof v === 'object' ? (v.id || v) : v;
      }
    });

    this.router.navigate(['..', 'detalle', grafico], {
      relativeTo: this.route,
      queryParams
    });
  }

  irADetalleRadar():    void { this.goDetalle('radar');    }
  irADetalleBarras():   void { this.goDetalle('barras');   }
  irADetalleBurbujas(): void { this.goDetalle('burbujas'); }
  irADetalleHeatmap():  void { this.goDetalle('heatmap');  }
  irADetalleLineas():   void { this.goDetalle('lineas');   }
  irADetalleEvolucion(): void { this.goDetalle('evolucion'); }
  irADetalleTramos(): void { this.goDetalle('tramos'); }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAR PDF
  // ═══════════════════════════════════════════════════════════════════════════

  private updateExportState(): void {
    const charts = this.buildChartsPayload();
    this.dashboardChartsReady = !this.cargando && ((this.chartDirs?.length ?? 0) > 0);
    this.canExportPdf = this.dashboardChartsReady && charts.length > 0;
  }

  private buildChartsPayload(): Array<{ id: string; tipoGrafico: string; chart: any; context: any }> {
    const context = this.analiticaService.obtenerFiltros();
    const out: Array<{ id: string; tipoGrafico: string; chart: any; context: any }> = [];

    // Radar
    if (this.radarDataRaw?.length) {
      out.push({
        id: 'chart_radar',
        tipoGrafico: 'radar',
        chart: {
          chartTitle: this.modoCursoActivo ? 'Competencias del Curso' : 'Competencias del Alumno',
          x: { labels: this.radarDataRaw.map(d => d.nombre) },
          series: [{ name: 'Porcentaje de logro', data: this.radarDataRaw.map(d => Number(d.valor ?? 0)) }],
          extra: { umbral: this.umbralActual }
        },
        context
      });
    }

    // Radar por Fase
    if (this.radarFaseDataRaw?.length) {
      out.push({
        id: 'chart_radar_fase',
        tipoGrafico: 'radar_fase',
        chart: {
          chartTitle: 'Vista por Fase (Operativa)',
          x: { labels: this.radarFaseDataRaw.map(d => d.nombre) },
          series: [{ name: 'Logro por fase', data: this.radarFaseDataRaw.map(d => Number(d.valor ?? 0)) }]
        },
        context
      });
    }

    // Barras
    if (this.barChartData?.labels?.length && this.barChartData?.datasets?.length) {
      out.push({
        id: 'chart_barras',
        tipoGrafico: 'barras',
        chart: {
          chartTitle: this.modoCursoActivo ? 'Promedio del Curso' : 'Alumno vs Promedio',
          x: { labels: this.barChartData.labels },
          series: this.barChartData.datasets.map((ds: any) => ({ name: ds.label, values: ds.data }))
        },
        context
      });
    }

    // Burbujas (usa el array crudo guardado, no el canvas)
    const datosBurbujasRaw = this.analiticaService.obtenerDatosGraficos('burbujas');
    let itemsBurbujas: any[] = [];
    let umbralBurbujas = 51;
    if (datosBurbujasRaw) {
      if (Array.isArray(datosBurbujasRaw)) {
        // Formato viejo (compatibilidad)
        itemsBurbujas = datosBurbujasRaw;
        umbralBurbujas = 51;
      } else if (datosBurbujasRaw.items) {
        // Formato nuevo
        itemsBurbujas = datosBurbujasRaw.items;
        umbralBurbujas = datosBurbujasRaw.umbral ?? 51;
      }
    }
    if (itemsBurbujas.length) {
      out.push({
        id: 'chart_burbujas',
        tipoGrafico: 'burbujas',
        chart: {
          chartTitle: 'Logro vs. Distancia al Umbral',
          extra: {
            umbral: umbralBurbujas,
            items: itemsBurbujas.map((d: any) => ({
              competencia: d.competencia || d.nombre,
              x: Number(d.x ?? 0),
              y: Number(d.y ?? 0),
              r: Number(d.r ?? 10),
              cumpleUmbral: d.cumpleUmbral
            }))
          }
        },
        context
      });
    }

    // Heatmap (NO es un canvas, se arma directo desde heatmapDataRaw)
    // Solo se incluye en el PDF cuando el modo es "Curso completo".
    if (this.modoCursoActivo && this.heatmapDataRaw && (this.heatmapDataRaw as any).filas && (this.heatmapDataRaw as any).competencias) {
      out.push({
        id: 'chart_heatmap',
        tipoGrafico: 'heatmap',
        chart: {
          chartTitle: 'Mapa de Calor del Curso',
          extra: { items: this.heatmapDataRaw }
        },
        context
      });
    }

    // Líneas / Trayectoria
    const datosLineasRaw = this.analiticaService.obtenerDatosGraficos('lineas');
    if (Array.isArray(datosLineasRaw) && datosLineasRaw.length) {
      out.push({
        id: 'chart_lineas',
        tipoGrafico: 'lineas',
        chart: {
          chartTitle: 'Trayectoria Académica',
          extra: { items: datosLineasRaw }
        },
        context
      });
    }

    // Evolución por Evaluación
    const datosEvolucionRaw = this.analiticaService.obtenerDatosGraficos('evolucion');
    if (Array.isArray(datosEvolucionRaw) && datosEvolucionRaw.length) {
      out.push({
        id: 'chart_evolucion',
        tipoGrafico: 'evolucion',
        chart: {
          chartTitle: 'Evolución por Evaluación',
          extra: { items: datosEvolucionRaw }
        },
        context
      });
    }

    // Distribución por Tramos
    if (this.distribucionTramosData?.length) {
      out.push({
        id: 'chart_tramos',
        tipoGrafico: 'tramos',
        chart: {
          chartTitle: 'Competencias del Perfil de Egreso',
          x: { labels: this.distribucionTramosData.map((f: any) => f.competencia) },
          series: [
            { name: 'Satisfactorio %', data: this.distribucionTramosData.map((f: any) => Number(f.satisfactorio)) },
            { name: 'Suficiente %', data: this.distribucionTramosData.map((f: any) => Number(f.suficiente)) },
            { name: 'Deficiente %', data: this.distribucionTramosData.map((f: any) => Number(f.deficiente)) }
          ],
          extra: {
            filas: this.distribucionTramosData,
            modoCurso: this.modoCursoActivo
          }
        },
        context
      });
    }

    return out;
  }

  descargarInforme(): void {
    const charts = this.buildChartsPayload();
    if (!charts.length) { alert('No hay gráficos disponibles para exportar'); return; }
    this.pdfLoading = true;

    const filtrosGenerados = this.analiticaService.obtenerFiltros();
    const alumnoNombreGenerado = filtrosGenerados.alumno === this.ALUMNO_CURSO
      ? 'Curso Completo'
      : ((filtrosGenerados as any).alumnoNombre || filtrosGenerados.alumno);

    const meta = {
      carrera: this.carreras.find(c => String(c.id) === String(filtrosGenerados.carrera))?.nombre || filtrosGenerados.carrera,
      plan: this.planes.find(p => String(p.id) === String(filtrosGenerados.plan))?.nombre || filtrosGenerados.plan,
      cohorte: this.cohortes.find(coh => String(coh.id) === String(filtrosGenerados.cohorte))?.nombre || filtrosGenerados.cohorte,
      semestre: this.semestres.find(s => String(s.id) === String(filtrosGenerados.semestre))?.nombre || filtrosGenerados.semestre,
      asignatura: this.asignaturas.find(a => String(a.id) === String(filtrosGenerados.asignatura))?.nombre || filtrosGenerados.asignatura,
      alumno: alumnoNombreGenerado,
      competencias: this.radarDataRaw.map(d => {
        const partes = String(d.nombre).split('·');
        return {
          codigo: partes[0]?.trim() || '',
          nombre: partes[1]?.trim() || ''
        };
      })
    };

    const payload = {
      charts: charts.map(c => ({ id: c.id, tipoGrafico: c.tipoGrafico, chart: c.chart, context: c.context })),
      meta
    };

    this.analiticaService.exportarReporteAnalitica(payload).subscribe({
      next: (resp: any) => {
        const blob = resp.body;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Reporte_Analitica.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.pdfLoading = false;
      },
      error: () => { this.pdfLoading = false; alert('No se pudo generar el reporte.'); }
    });
  }

  private clampLines(doc: jsPDF, text: string, maxWidth: number, maxLines: number): string[] {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    if (lines.length <= maxLines) return lines;
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] += '…';
    return cut;
  }

  private cachedLogoDataUrl: string | null = null;
  private async loadAssetAsDataUrl(url: string): Promise<string> {
    const res  = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  private async getLogoDataUrl(): Promise<string> {
    if (this.cachedLogoDataUrl) return this.cachedLogoDataUrl;
    try { this.cachedLogoDataUrl = await this.loadAssetAsDataUrl('assets/1-Logo UNACH-02.webp'); }
    catch { this.cachedLogoDataUrl = ''; }
    return this.cachedLogoDataUrl;
  }

  private addHeaderWithLogo(doc: jsPDF, logoDataUrl: string): void {
    const margin = 10;
    if (logoDataUrl) {
      const logoW = 22;
      const props = doc.getImageProperties(logoDataUrl);
      const logoH = (logoW * (props as any).height) / (props as any).width;
      doc.addImage(logoDataUrl, 'PNG', margin, 8, logoW, logoH);
      const tx = margin + logoW + 6;
      doc.setFont('helvetica', 'bold');   doc.setFontSize(14); doc.text('INFORME ANALÍTICA', tx, 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(new Date().toLocaleString(), tx, 19);
    } else {
      doc.setFont('helvetica', 'bold');   doc.setFontSize(14); doc.text('INFORME ANALÍTICA', margin, 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(new Date().toLocaleString(), margin, 19);
    }
  }

  private async generatePdf(charts: Array<{ id: string; title: string; canvasDataUrl: string }>, insightsMap: Map<string, string>): Promise<void> {
    const chartsLimited = charts.slice(0, 4);
    const doc   = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const logoDataUrl = await this.getLogoDataUrl();
    this.addHeaderWithLogo(doc, logoDataUrl);
    const margin = 10, gap = 6;
    const colW = (pageW - margin * 2 - gap) / 2;
    const chartH = 55, pad = 3;
    let y = 28;
    const titleFont = 10, bodyFont = 9;
    for (let i = 0; i < chartsLimited.length; i++) {
      const c   = chartsLimited[i];
      const col = i % 2;
      const x   = margin + col * (colW + gap);
      const insight   = insightsMap.get(c.id) || 'Sin insight disponible.';
      doc.setFontSize(bodyFont);
      const textLines = this.clampLines(doc, `Insight IA: ${insight}`, colW, 2);
      const titleH    = titleFont * 0.6;
      const lineH     = 4;
      const cardH     = titleH + pad + chartH + pad + textLines.length * lineH + pad;
      if (y + cardH > pageH - margin) break;
      doc.setFont('helvetica', 'bold');   doc.setFontSize(titleFont); doc.text(c.title, x, y);
      if (c.canvasDataUrl) doc.addImage(c.canvasDataUrl, 'PNG', x, y + pad, colW, chartH, undefined, 'FAST');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(bodyFont);  doc.text(textLines as any, x, y + pad + chartH + pad + 3);
      if (col === 1 || i === chartsLimited.length - 1) y += cardH + 6;
    }
    doc.save('informe-analitica.pdf');
  }
}

