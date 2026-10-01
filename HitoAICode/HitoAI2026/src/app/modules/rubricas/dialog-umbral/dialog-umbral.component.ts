import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AsignaturaService } from '../../../services/asignatura.service';

@Component({
  selector: 'app-dialog-umbral',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-umbral.component.html',
  styleUrls: ['./dialog-umbral.component.css']
})
export class DialogUmbralComponent {
  @Input() asignaturaID!: string;
  @Input() nombreAsignatura = '';
  @Input() umbralActual: number | null = null;

  umbral: number | null = null;
  mensajeError = '';
  mensajeExito = '';
  bloqueado = false;
  private modalCerrado = false;

  constructor(
    public modal: NgbActiveModal,
    private asignaturaService: AsignaturaService
  ) {}

  ngOnInit(): void {
    this.umbral = this.umbralActual;
  }

  guardar(): void {
    if (this.umbral === null || this.umbral === undefined || (this.umbral as any) === '') {
      this.mensajeError = 'Debe ingresar un valor de umbral.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }
    if (this.umbral < 0 || this.umbral > 100) {
      this.mensajeError = 'El umbral debe estar entre 0 y 100.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Umbral actualizado correctamente';

    this.asignaturaService.actualizarUmbral(this.asignaturaID, this.umbral).subscribe({
      next: () => {
        setTimeout(() => this.cerrarConExito(), 1200);
      },
      error: () => {
        this.bloqueado = false;
        this.mensajeExito = '';
        this.mensajeError = 'Error al actualizar el umbral. Intente nuevamente.';
        setTimeout(() => (this.mensajeError = ''), 3000);
      }
    });
  }

  cancelar(): void {
    if (!this.bloqueado) this.modal.dismiss();
  }

  cerrarToast(): void {
    this.cerrarConExito();
  }

  private cerrarConExito(): void {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }
}
