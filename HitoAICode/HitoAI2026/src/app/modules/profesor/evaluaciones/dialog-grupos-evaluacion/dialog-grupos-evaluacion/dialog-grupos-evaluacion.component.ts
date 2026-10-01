import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AplicacionService } from '../../../../../services/aplicacion.service';
import { InscripcionService } from '../../../../../services/inscripcion.service';
import { Estudiante } from '../../../../../models';
import { FormsModule } from '@angular/forms';
import { RutFormatPipe } from '../../../../../pipes/rut-format.pipe';

@Component({
  selector: 'app-dialog-grupos-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RutFormatPipe],
  templateUrl: './dialog-grupos-evaluacion.component.html'
})
export class DialogGruposEvaluacionComponent implements OnInit {
  @Input() evaluacionID!: number;
  @Input() asignaturaID!: string;

  estudiantes: Estudiante[] = [];
  seleccionados: Set<string> = new Set();
  bloqueados: Set<string> = new Set();
  modo: 'individual' | 'grupo' = 'grupo';

  mensajeError: string = '';

  constructor(
    public modal: NgbActiveModal,
    private inscripcionService: InscripcionService,
    private aplicacionService: AplicacionService
  ) {}

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes() {
    this.inscripcionService.obtenerPorAsignatura(this.asignaturaID).subscribe(data => {
      this.estudiantes = data;

      this.aplicacionService.obtenerAplicacionesAgrupadas(this.evaluacionID, this.asignaturaID).subscribe(apps => {
        const bloqueados = new Set<string>();
        for (const app of apps) {
          if (app.Grupo && app.Grupo > 0) {
            bloqueados.add(app.ID_Estudiante);
          }
        }
        this.bloqueados = bloqueados;
      });
    });
  }

  cambiarModo(nuevoModo: 'individual' | 'grupo') {
    this.modo = nuevoModo;
    this.seleccionados.clear();
  }

  toggleSeleccion(estudianteID: string) {
    if (this.bloqueados.has(estudianteID)) return;

    if (this.modo === 'individual') {
      if (this.seleccionados.has(estudianteID)) {
        this.seleccionados.clear();
      } else {
        this.seleccionados.clear();
        this.seleccionados.add(estudianteID);
      }
      return;
    }

    if (this.seleccionados.has(estudianteID)) {
      this.seleccionados.delete(estudianteID);
    } else {
      this.seleccionados.add(estudianteID);
    }
  }

  confirmar() {
    const seleccionadosArray = this.estudiantes.filter(e => this.seleccionados.has(e.ID_Estudiante));

    if (seleccionadosArray.length === 0) {
      this.mensajeError = this.modo === 'individual'
        ? 'Debes seleccionar un estudiante.'
        : 'Debes seleccionar al menos un estudiante que no esté en un grupo.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    this.modal.close(seleccionadosArray);
  }

  cancelar() {
    this.modal.dismiss();
  }
}
