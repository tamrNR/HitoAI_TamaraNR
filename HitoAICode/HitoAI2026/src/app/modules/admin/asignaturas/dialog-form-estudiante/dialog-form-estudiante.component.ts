import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EstudianteService } from '../../../../services/estudiante.service';
import { Estudiante } from '../../../../models';
import { cleanRut, validarRut } from '../../../../utils/rut';
import { RutFormatPipe } from '../../../../pipes/rut-format.pipe';


@Component({
  selector: 'app-dialog-form-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule, RutFormatPipe],
  templateUrl: './dialog-form-estudiante.component.html',
  styleUrls: ['./dialog-form-estudiante.component.css']
})
export class DialogFormEstudianteComponent implements OnInit {
  @Input() modo: 'crear' | 'ver' | 'editar' = 'crear';
  @Input() datos: Estudiante | null = null;

  estudiante: Estudiante = {
    ID_Estudiante: '',
    Nombre: '',
    Apellido: '',
    Anio_Ingreso: new Date().getFullYear()
  };

  mensajeExito = '';
  mensajeError = '';
  accionConfirmada: 'crear' | 'actualizar' | 'eliminar' | null = null;
  bloqueado = false;
  private modalCerrado = false;

  constructor(public modal: NgbActiveModal, private estudianteService: EstudianteService) {}

  ngOnInit(): void {
    if (this.datos) {
      this.estudiante = { ...this.datos };
    }
  }

  cancelar() {
    if (!this.bloqueado) this.modal.dismiss();
  }

  cancelarConfirmacion() {
    this.accionConfirmada = null;
  }

  cerrarToast() {
    this.cerrarConExito();
  }

  crear() {
    if (!this.estudiante.ID_Estudiante || !this.estudiante.Nombre || !this.estudiante.Apellido) {
      this.mensajeError = 'Por favor, complete todos los campos.';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }

    const rut = cleanRut(this.estudiante.ID_Estudiante);
    if (!validarRut(rut)) {
      this.mensajeError = 'RUT inválido';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }
    this.estudiante.ID_Estudiante = rut;

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'crear';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Estudiante creado con éxito';
    this.estudianteService.crear(this.estudiante).subscribe({
      next: () => {
        setTimeout(() => this.cerrarConExito(), 1500);
      },
      error: (err) => {
        this.bloqueado = false;
        this.mensajeExito = '';
        this.mensajeError = err.error?.message || 'Error al crear estudiante';
        setTimeout(() => (this.mensajeError = ''), 3000);
      }
    });
  }

  actualizar() {
    if (!this.estudiante.Nombre || !this.estudiante.Apellido) {
      this.mensajeError = 'Complete todos los campos.';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }

    const rut = cleanRut(this.estudiante.ID_Estudiante);
    if (!validarRut(rut)) {
      this.mensajeError = 'RUT inválido';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }
    this.estudiante.ID_Estudiante = rut;

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'actualizar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Estudiante actualizado correctamente';
    this.estudianteService.actualizar(this.estudiante.ID_Estudiante, this.estudiante).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  eliminar() {
    if (!this.accionConfirmada) {
      this.accionConfirmada = 'eliminar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Estudiante eliminado';
    this.estudianteService.eliminar(this.estudiante.ID_Estudiante).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  private cerrarConExito() {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }
}
