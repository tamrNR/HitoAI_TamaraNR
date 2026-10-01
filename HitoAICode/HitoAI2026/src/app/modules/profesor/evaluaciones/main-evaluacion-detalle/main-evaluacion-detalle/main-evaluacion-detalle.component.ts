import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { AplicacionService } from '../../../../../services/aplicacion.service';
import { DialogGruposEvaluacionComponent } from '../../dialog-grupos-evaluacion/dialog-grupos-evaluacion/dialog-grupos-evaluacion.component';
import { DialogRubricaEvaluacionComponent } from '../../dialog-rubrica-evaluacion/dialog-rubrica-evaluacion.component';

@Component({
  selector: 'app-main-evaluacion-detalle',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './main-evaluacion-detalle.component.html'
})
export class MainEvaluacionDetalleComponent implements OnInit {
  @Input() evaluacionID!: number;
  @Input() asignaturaID!: string;

  evaluados: Set<number> = new Set();
  grupos: { numero: number, estudiantes: any[], nota: number }[] = [];

  mensajeExito = '';
  mensajeError = '';
  bloqueado = false;

  accionConfirmada: number | null = null;

  constructor(
    public modal: NgbActiveModal,
    private aplicacionService: AplicacionService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.cargarEvaluados();
    this.cargarGrupos();
  }

  cancelar() {
    this.modal.dismiss();
  }

  cargarEvaluados() {
    this.aplicacionService.obtenerAplicados(this.evaluacionID, this.asignaturaID).subscribe((data: number[]) => {
      this.evaluados = new Set(data);
    });
  }

  cargarGrupos() {
    this.aplicacionService.obtenerAplicacionesAgrupadas(this.evaluacionID, this.asignaturaID).subscribe((data: any[]) => {
      const agrupado: {
        [grupo: number]: { estudiantes: any[]; total: number; max: number };
      } = {};

      for (const app of data) {
        if (!agrupado[app.Grupo]) {
          agrupado[app.Grupo] = { estudiantes: [], total: 0, max: 0 };
        }

        if (!agrupado[app.Grupo].estudiantes.some((e: any) => e.ID_Estudiante === app.ID_Estudiante)) {
          agrupado[app.Grupo].estudiantes.push({
            ID_Estudiante: app.ID_Estudiante,
            Nombre: app.Nombre,
            Apellido: app.Apellido
          });
        }

        agrupado[app.Grupo].total += app.Obtenido;
        agrupado[app.Grupo].max += app.Puntaje_Max;
      }

      this.grupos = Object.keys(agrupado)
        .map(g => ({
          numero: +g,
          estudiantes: agrupado[+g].estudiantes,
          nota: agrupado[+g].max ? Math.round((agrupado[+g].total / agrupado[+g].max) * 100) : 0
        }))
        .sort((a, b) => a.numero - b.numero);
    });
  }

  abrirRubrica(grupo: any, numero: number) {
    const modalRef = this.modalService.open(DialogRubricaEvaluacionComponent, {
      centered: true,
      size: 'xl',
      scrollable: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.evaluacionID = this.evaluacionID;
    modalRef.componentInstance.asignaturaID = this.asignaturaID;
    modalRef.componentInstance.estudiantes = grupo.estudiantes;
    modalRef.componentInstance.nombreGrupo = grupo.estudiantes.length === 1
      ? `${grupo.estudiantes[0].Nombre} ${grupo.estudiantes[0].Apellido}` 
      : `Grupo ${numero}`;

    modalRef.result.then(result => {
      if (result === 'actualizado') {
        this.cargarGrupos();
        this.cargarEvaluados();
        this.mensajeExito = 'Evaluación actualizada correctamente';
        this.bloqueado = true;
        setTimeout(() => {
          this.mensajeExito = '';
          this.bloqueado = false;
        }, 3000);
      }
    }).catch(() => {});
  }

  abrirDialogGrupo() {
    const estudiantesAgrupados = new Set(
      this.grupos.flatMap(grupo => grupo.estudiantes.map((e: any) => e.ID_Estudiante))
    );

    const modalRef = this.modalService.open(DialogGruposEvaluacionComponent, {
      centered: true,
      size: 'lg',
      scrollable: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.evaluacionID = this.evaluacionID;
    modalRef.componentInstance.asignaturaID = this.asignaturaID;
    modalRef.componentInstance.estudiantesAgrupados = estudiantesAgrupados;

    modalRef.result.then(grupo => {
      if (grupo && Array.isArray(grupo)) {
        this.aplicacionService.obtenerGruposPorEvaluacion(this.evaluacionID, this.asignaturaID).subscribe((ids: number[]) => {
          const nuevoGrupoN = Math.max(0, ...ids) + 1;
          this.bloqueado = true;
          this.aplicacionService.asignarGrupoAGrupo({
            estudiantes: grupo.map((e: any) => e.ID_Estudiante),
            evaluacionID: this.evaluacionID,
            asignaturaID: this.asignaturaID
          }, nuevoGrupoN).subscribe({
            next: () => {
              this.mensajeExito = `Grupo #${nuevoGrupoN} creado correctamente`;
              setTimeout(() => {
                this.bloqueado = false;
                this.mensajeExito = '';
                this.cargarGrupos();
                this.cargarEvaluados();
              }, 3000);
            },
            error: () => {
              this.bloqueado = false;
              this.mensajeError = 'No se pudo crear el grupo';
              setTimeout(() => this.mensajeError = '', 3000);
            }
          });
        });
      }
    }).catch(() => {});
  }

  esGrupoEvaluado(grupo: any): boolean {
    return grupo.estudiantes.every((est: any) => this.evaluados.has(est.ID_Estudiante));
  }

  confirmarDisolver(grupo: number) {
    this.accionConfirmada = grupo;
  }

  cancelarConfirmacion() {
    this.accionConfirmada = null;
  }

  disolverGrupoConfirmado(grupoNumero: number) {
    this.bloqueado = true;
    this.aplicacionService.disolverGrupo(grupoNumero, this.evaluacionID, this.asignaturaID).subscribe({
      next: () => {
        this.mensajeExito = `Grupo #${grupoNumero} disuelto correctamente`;
        this.accionConfirmada = null;
        setTimeout(() => {
          this.bloqueado = false;
          this.mensajeExito = '';
          this.cargarGrupos();
          this.cargarEvaluados();
        }, 3000);
      },
      error: () => {
        this.bloqueado = false;
        this.mensajeError = 'No se pudo disolver el grupo';
        setTimeout(() => this.mensajeError = '', 3000);
      }
    });
  }
}
