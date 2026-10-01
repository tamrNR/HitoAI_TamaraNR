import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AplicacionService } from '../../../../services/aplicacion.service';
import { IndicadorService } from '../../../../services/indicador.service';

@Component({
  selector: 'app-dialog-rubrica-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-rubrica-evaluacion.component.html'
})
export class DialogRubricaEvaluacionComponent implements OnInit {
  @Input() evaluacionID!: number;
  @Input() asignaturaID!: string;
  @Input() estudiantes: any[] = [];
  @Input() nombreGrupo: string = '';

  indicadores: any[] = [];
  criterios: { [indicadorID: number]: any[] } = {};
  puntajes: { [indicadorID: number]: number } = {};
  modoSoloLectura = false;

  mensajeExito = '';
  mensajeError = '';
  bloqueado = false;
  mostrarConfirmacion = false;

  constructor(
    public modal: NgbActiveModal,
    private aplicacionService: AplicacionService,
    private indicadorService: IndicadorService
  ) {}

  ngOnInit(): void {
    this.cargarIndicadoresYcargarPuntajes();
  }

  get tituloGrupo(): string {
    return this.nombreGrupo || this.estudiantes.map(e => `${e.Nombre} ${e.Apellido}`).join(', ');
  }

  async cargarIndicadoresYcargarPuntajes() {
    this.indicadores = await this.aplicacionService
      .obtenerIndicadoresPorEvaluacion(this.evaluacionID, this.asignaturaID)
      .toPromise() ?? [];

    const cargas = this.indicadores.map(async indicador => {
      const lista = await this.indicadorService
        .obtenerCriteriosPorIndicador(indicador.ID_Indicador)
        .toPromise() ?? [];
      this.criterios[indicador.ID_Indicador] = lista;
    });

    await Promise.all(cargas);
    await this.cargarPuntajesPrevios();
  }

  async cargarPuntajesPrevios() {
    const mapa: { [indicadorID: number]: number[] } = {};
    let algunEvaluado = false;

    for (const est of this.estudiantes) {
      const datos = await this.aplicacionService
        .obtenerPuntajesEstudiante(this.evaluacionID, this.asignaturaID, est.ID_Estudiante)
        .toPromise() ?? [];

      console.log('📊 Puntajes para estudiante:', est.ID_Estudiante, datos);

      for (const p of datos) {
        if (!mapa[p.indicador_ID_Indicador]) mapa[p.indicador_ID_Indicador] = [];
        mapa[p.indicador_ID_Indicador].push(p.Obtenido);

        if (p.Obtenido > 0) algunEvaluado = true;
      }
    }

    for (const id in mapa) {
      const valores = mapa[id];
      const iguales = valores.every(v => v === valores[0]);

      if (iguales) {
        this.puntajes[id] = valores[0];
      }
    }

    this.modoSoloLectura = algunEvaluado;
    console.log('✅ Puntajes mapeados:', this.puntajes);
    console.log('🔒 modoSoloLectura:', this.modoSoloLectura);
  }

  calcularTotal(): number {
    return Object.values(this.puntajes).reduce((a, b) => a + (b || 0), 0);
  }

  calcularPuntajeIdeal(): number {
    return this.indicadores.reduce(
      (acc, ind) => acc + ind.Puntaje_Max,
      0
    );
  }

  calcularNota(): number {
    const totalMax = this.calcularPuntajeIdeal();
    if (totalMax === 0) return 0;
    return Math.round((this.calcularTotal() / totalMax) * 100);
  }

  hayErroresDePuntaje(): boolean {
    return this.indicadores.some(i => {
      const val = this.puntajes[i.ID_Indicador];
      return val != null && (val < 0 || val > i.Puntaje_Max);
    });
  }

  habilitarEdicion() {
    this.modoSoloLectura = false;
  }

  confirmarGuardado() {
    this.mostrarConfirmacion = true;
  }

  cancelarConfirmacion() {
    this.mostrarConfirmacion = false;
  }

  guardar() {
    const grupo = this.estudiantes.map(e => e.ID_Estudiante);
    const data = this.indicadores.map(ind => ({
      evaluacionID: this.evaluacionID,
      asignaturaID: this.asignaturaID,
      indicadorID: ind.ID_Indicador,
      estudiantes: grupo,
      obtenido: this.puntajes[ind.ID_Indicador] || 0
    }));

    this.bloqueado = true;
    this.aplicacionService.actualizarPuntajesGrupo(data).subscribe(() => {
      this.mensajeExito = 'Puntajes guardados correctamente';
      setTimeout(() => this.modal.close('actualizado'), 1500);
    }, () => {
      this.bloqueado = false;
      this.mensajeError = 'Error al guardar los puntajes';
      setTimeout(() => this.mensajeError = '', 3000);
    });
  }

  cancelar() {
    this.modal.dismiss();
  }
}
