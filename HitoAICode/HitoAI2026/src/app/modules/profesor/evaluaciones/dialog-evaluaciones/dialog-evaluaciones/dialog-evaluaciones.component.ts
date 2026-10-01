import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EvaluacionService } from '../../../../../services/evaluacion.service';
import { AplicacionService } from '../../../../../services/aplicacion.service';
import { InscripcionService } from '../../../../../services/inscripcion.service';
import { DialogCrearEvaluacionComponent } from '../../dialog-crear-evaluacion/dialog-crear-evaluacion/dialog-crear-evaluacion.component';
import { DialogEditarEvaluacionComponent } from '../../dialog-editar-evaluacion/dialog-editar-evaluacion/dialog-editar-evaluacion.component';
import { MainEvaluacionDetalleComponent } from '../../main-evaluacion-detalle/main-evaluacion-detalle/main-evaluacion-detalle.component';

@Component({
  selector: 'app-dialog-evaluaciones',
  standalone: true,
  templateUrl: './dialog-evaluaciones.component.html',
  styleUrls: ['./dialog-evaluaciones.component.css'],
  imports: [CommonModule, FormsModule]
})
export class DialogEvaluacionesComponent implements OnInit {
  @Input() asignatura: any;

  evaluaciones: any[] = [];
  totalEstudiantes = 0;
  accionConfirmada: number | null = null;
  mensajeExito = '';
  mensajeError = '';
  bloqueado = false;

  constructor(
    public modal: NgbActiveModal,
    private modalService: NgbModal,
    private evaluacionService: EvaluacionService,
    private aplicacionService: AplicacionService,
    private inscripcionService: InscripcionService
  ) {}

  ngOnInit(): void {
    this.inscripcionService
      .obtenerPorAsignatura(this.asignatura.ID_Asignatura)
      .subscribe(est => {
        this.totalEstudiantes = est.length;
        this.cargarEvaluaciones();
      });
  }

  cargarEvaluaciones() {
    this.evaluacionService
      .obtenerPorAsignatura(this.asignatura.ID_Asignatura)
      .subscribe(
        (data) => {
          this.evaluaciones = data;
          for (const eva of this.evaluaciones) {
            this.aplicacionService
              .obtenerAplicados(eva.ID_Evaluacion, this.asignatura.ID_Asignatura)
              .subscribe((ids) => {
                eva.completada =
                  this.totalEstudiantes > 0 && ids.length >= this.totalEstudiantes;
              });
          }
        },
        (error) => {
          console.error('Error al cargar evaluaciones:', error);
        }
      );
  }

  abrirDialogCrearEvaluacion() {
    const modalRef = this.modalService.open(DialogCrearEvaluacionComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.asignatura = this.asignatura;

    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarEvaluaciones();
    }).catch(() => {});
  }

  editar(evaluacion: any) {
    const modalRef = this.modalService.open(DialogEditarEvaluacionComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.evaluacion = evaluacion;

    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarEvaluaciones();
    }).catch(() => {});
  }

  abrirDetalleEvaluacion(evaluacionID: number) {
    const modalRef = this.modalService.open(MainEvaluacionDetalleComponent, {
      centered: true,
      size: 'xl',
      scrollable: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.evaluacionID = evaluacionID;
    modalRef.componentInstance.asignaturaID = this.asignatura.ID_Asignatura;

    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarEvaluaciones();
    }).catch(() => {});
  }

  confirmarEliminar(id: number) {
    this.accionConfirmada = id;
  }

  cancelarConfirmacion() {
    this.accionConfirmada = null;
  }

  eliminarConfirmado(id: number) {
    this.bloqueado = true;
    this.evaluacionService.eliminar(id).subscribe({
      next: () => {
        this.mensajeExito = 'Evaluación eliminada';
        this.accionConfirmada = null;
        setTimeout(() => {
          this.mensajeExito = '';
          this.bloqueado = false;
          this.cargarEvaluaciones();
        }, 1500);
      },
      error: () => {
        this.bloqueado = false;
        this.mensajeError = 'No se pudo eliminar la evaluación';
        setTimeout(() => (this.mensajeError = ''), 3000);
      }
    });
  }

  cerrar() {
    this.modal.close();
  }
}
