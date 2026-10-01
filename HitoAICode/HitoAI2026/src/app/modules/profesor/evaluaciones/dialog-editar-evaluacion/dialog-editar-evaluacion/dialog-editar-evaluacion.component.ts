import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EvaluacionService } from '../../../../../services/evaluacion.service';

@Component({
  selector: 'app-dialog-editar-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-editar-evaluacion.component.html'
})
export class DialogEditarEvaluacionComponent implements OnInit {
  @Input() evaluacion: any;

  nombre = '';
  tipo = '';
  fecha = '';
  instancia = 1;

  mensajeError = '';
  mensajeExito = '';
  bloqueado = false;

  constructor(
    public modal: NgbActiveModal,
    private evaluacionService: EvaluacionService
  ) {}

  ngOnInit(): void {
    this.nombre = this.evaluacion.Nombre;
    this.tipo = this.evaluacion.Tipo;
    this.fecha = (this.evaluacion.Fecha ?? '').split('T')[0];
    this.instancia = this.evaluacion.N_Instancia;
  }

  guardar() {
    if (!this.nombre || !this.tipo || !this.fecha) {
      this.mensajeError = 'Debes completar todos los campos.';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }

    this.bloqueado = true;

    const data = {
      Nombre: this.nombre,
      Tipo: this.tipo,
      N_Instancia: this.instancia,
      Fecha: this.fecha
    };

    this.evaluacionService.actualizar(this.evaluacion.ID_Evaluacion, data).subscribe({
      next: () => {
        this.mensajeExito = 'Evaluación actualizada con éxito';
        setTimeout(() => this.modal.close('actualizado'), 1500);
      },
      error: (err) => {
        this.bloqueado = false;
        this.mensajeError = err?.error?.message || 'Error al actualizar evaluación.';
        setTimeout(() => this.mensajeError = '', 3000);
      }
    });
  }

  cancelar() {
    if (!this.bloqueado) this.modal.dismiss();
  }
}
