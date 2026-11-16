import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ComiteService } from '../../../services/comite.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

const COLORES = {
  azulOscuro: '#002F5D',
  azul: '#0073E6',
  verde: '#43a047',
  rojo: '#e53935',
  amarillo: '#fdd835',
  naranja: '#fb8c00',
  morado: '#8e24aa'
};

const COLORES_ESTADO: { [key: string]: { borde: string; fondo: string; texto: string; label: string } } = {
  sin_ra:          { borde: COLORES.rojo,    fondo: 'rgba(229,57,53,0.08)',  texto: '#c62828', label: 'Sin RA' },
  sin_contenidos:  { borde: COLORES.naranja, fondo: 'rgba(251,140,0,0.10)',  texto: '#ef6c00', label: 'Sin contenidos' },
  sin_indicadores: { borde: '#f9a825',      fondo: 'rgba(253,216,53,0.15)', texto: '#f57f17', label: 'Sin indicadores' },
  completa:        { borde: COLORES.verde,  fondo: 'rgba(67,160,71,0.08)',   texto: '#2e7d32', label: 'Completa' }
};

@Component({
  selector: 'app-home-comite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  usuarioNombre = '';

  filtros: { carreras: any[]; planes: any[] } = { carreras: [], planes: [] };
  carreraSel: number | null = null;
  planSel: number | null = null;

  cargando = false;
  error: string | null = null;
  dashboard: any = null;
  soloIncompletas = false;

  coberturaFilas: any[] = [];
  totalAsignaturasActivas = 0;
  coberturaExpandidas = new Set<string>();
  private tributacionDetalle = new Map<string, Map<number, Map<number, Map<string, { id: string; nombre: string; n_ra: number }>>>>();

  readonly coloresEstado = COLORES_ESTADO;

  constructor(
    private comiteService: ComiteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioNombre = localStorage.getItem('nombre') || '';
    const c = Number(localStorage.getItem('comite.carrera'));
    const p = Number(localStorage.getItem('comite.plan'));
    this.carreraSel = c > 0 ? c : null;
    this.planSel = p > 0 ? p : null;

    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;
    this.comiteService.getDashboard(this.carreraSel, this.planSel).subscribe({
      next: (data) => {
        this.filtros = data.filtros || { carreras: [], planes: [] };
        this.dashboard = data;

        // Autoseleccionar primera carrera si no hay una válida
        if (this.carreraSel == null && this.filtros.carreras.length > 0) {
          this.carreraSel = Number(this.filtros.carreras[0].id);
          this.guardarSeleccion();
          this.cargar();
          return;
        }
        // Validar que el plan guardado siga existiendo para la carrera
        if (this.planSel != null &&
            !this.filtros.planes.some((p: any) => Number(p.id) === Number(this.planSel))) {
          this.planSel = null;
          this.guardarSeleccion();
          this.cargar();
          return;
        }

        this.construirVista();
        this.cargando = false;
      },
      error: (err) => {
        console.error('[ComiteHome] Error cargando dashboard:', err);
        this.error = 'No se pudo cargar el panel. Intenta nuevamente.';
        this.cargando = false;
      }
    });
  }

  onCarreraChange(): void {
    this.planSel = null;
    this.guardarSeleccion();
    this.cargar();
  }

  onPlanChange(): void {
    this.guardarSeleccion();
    this.cargar();
  }

  private guardarSeleccion(): void {
    if (this.carreraSel != null) localStorage.setItem('comite.carrera', String(this.carreraSel));
    if (this.planSel != null) localStorage.setItem('comite.plan', String(this.planSel));
    else localStorage.removeItem('comite.plan');
  }

  // ---------- Datos derivados ----------

  get mallaVisible(): any[] {
    const malla = this.dashboard?.malla || [];
    return this.soloIncompletas ? malla.filter((a: any) => a.estado !== 'completa') : malla;
  }

  get mallaPorSemestre(): { semestre: number; items: any[] }[] {
    const grupos = new Map<number, any[]>();
    for (const a of this.mallaVisible) {
      const sem = Number(a.semestre) || 0;
      if (!grupos.has(sem)) grupos.set(sem, []);
      grupos.get(sem)!.push(a);
    }
    return Array.from(grupos.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([semestre, items]) => ({ semestre, items }));
  }

  get sinContenidos(): any[] {
    return (this.dashboard?.malla || []).filter((a: any) => a.estado === 'sin_contenidos');
  }

  get planNombre(): string {
    const p = this.filtros.planes.find((x: any) => Number(x.id) === Number(this.planSel));
    return p?.nombre || `Plan ${this.planSel}`;
  }

  tooltipAsignatura(a: any): string {
    const est = COLORES_ESTADO[a.estado]?.label || a.estado;
    return `${a.nombre}\nDocente: ${a.docente || 'Sin asignar'}\nRA: ${a.n_ra} · Contenidos: ${a.n_contenidos} · Indicadores: ${a.n_indicadores}\nEstado: ${est}`;
  }

  irAAsignatura(a: any): void {
    if (a.estado === 'sin_ra') {
      this.router.navigate(['/comite/ra'], { queryParams: { asignatura: a.id } });
    } else {
      this.router.navigate(['/comite/contenidos'], { queryParams: { q: a.id } });
    }
  }

  // ---------- Cobertura de competencias ----------

  colorCobertura(c: any): string {
    if (!c.n_asignaturas || c.n_asignaturas === 0) return COLORES.rojo;
    if (c.porcentaje < 34) return COLORES.amarillo;
    return COLORES.verde;
  }

  toggleCobertura(id: string | number): void {
    const key = String(id);
    if (this.coberturaExpandidas.has(key)) this.coberturaExpandidas.delete(key);
    else this.coberturaExpandidas.add(key);
  }

  estaExpandida(id: string | number): boolean {
    return this.coberturaExpandidas.has(String(id));
  }

  detalleCobertura(compId: string | number): { numero: number; columnas: { semestre: number; items: { id: string; nombre: string; n_ra: number }[] }[] }[] {
    const porAnio = this.tributacionDetalle.get(String(compId));
    if (!porAnio) return [];
    return Array.from(porAnio.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([anio, porSem]) => ({
        numero: anio,
        columnas: [2 * anio - 1, 2 * anio].map(sem => ({
          semestre: sem,
          items: Array.from((porSem.get(sem) || new Map()).values())
            .sort((x, y) => x.nombre.localeCompare(y.nombre))
        }))
      }));
  }

  // ---------- Construcción de la vista ----------

  private construirVista(): void {
    this.construirCobertura();
    this.construirTributacion();
    this.coberturaExpandidas.clear();
  }

  private construirCobertura(): void {
    const datos = this.dashboard?.cobertura || [];
    this.totalAsignaturasActivas = this.dashboard?.malla?.length || 0;

    this.coberturaFilas = datos
      .map((c: any) => {
        const n_asignaturas = Number(c.n_asignaturas) || 0;
        const porcentaje = this.totalAsignaturasActivas > 0
          ? Math.min(100, (n_asignaturas / this.totalAsignaturasActivas) * 100)
          : 0;
        return { ...c, n_asignaturas, n_ra: Number(c.n_ra) || 0, porcentaje };
      })
      .sort((a: any, b: any) => a.porcentaje - b.porcentaje || a.nombre.localeCompare(b.nombre));
  }

  // tributacion: competencia -> año -> semestre -> asignatura (RA sumados por asignatura)
  private construirTributacion(): void {
    const filas = this.dashboard?.tributacion || [];
    this.tributacionDetalle = new Map();

    for (const f of filas) {
      const compId = String(f.competencia);
      const sem = Number(f.semestre) || 0;
      const anio = sem > 0 ? Math.ceil(sem / 2) : 1;
      const semKey = sem > 0 ? sem : 2 * anio - 1;
      const asigKey = String(f.asignatura);

      if (!this.tributacionDetalle.has(compId)) {
        this.tributacionDetalle.set(compId, new Map());
      }
      const porAnio = this.tributacionDetalle.get(compId)!;
      if (!porAnio.has(anio)) porAnio.set(anio, new Map());
      const porSem = porAnio.get(anio)!;
      if (!porSem.has(semKey)) porSem.set(semKey, new Map());
      const porAsignatura = porSem.get(semKey)!;
      if (!porAsignatura.has(asigKey)) {
        porAsignatura.set(asigKey, { id: asigKey, nombre: f.asignatura_nombre, n_ra: 0 });
      }
      porAsignatura.get(asigKey)!.n_ra += Number(f.n_ra) || 0;
    }
  }
}
