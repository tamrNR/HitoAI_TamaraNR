import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContenidoService } from '../../../services/contenido.service';

@Component({
  selector: 'app-dialog-form-contenido',
  standalone: true,
  templateUrl: './dialog-form-contenido.component.html',
  styleUrls: ['./dialog-form-contenido.component.css'],
  imports: [CommonModule, FormsModule]
})
export class DialogFormContenidoComponent implements OnInit {
  @Input() modo: 'crear' | 'ver' | 'editar' = 'crear';
  @Input() datos: any = null;
  @Input() asignaturaID: string = '';

contenido = {
  ID_Contenido: 0,
  Nucleo_Tematico: '',
  Descripcion: '',
  Horas: 0,
  asignatura_ID_Asignatura: ''
};


  mensajeExito = '';
  mensajeError = '';
  accionConfirmada: 'crear' | 'actualizar' | 'eliminar' | null = null;
  bloqueado = false;
  private modalCerrado = false;

  constructor(
    public modal: NgbActiveModal,
    private contenidoService: ContenidoService
  ) {}

  ngOnInit(): void {
    if (this.datos) {
      this.contenido = { ...this.datos };
    } else {
      this.contenido.asignatura_ID_Asignatura = this.asignaturaID;
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
if (!this.contenido.Nucleo_Tematico || !this.contenido.Descripcion || this.contenido.Horas <= 0) {
  this.mensajeError = 'Complete todos los campos correctamente.';
  setTimeout(() => this.mensajeError = '', 3000);
  return;
}


    if (!this.accionConfirmada) {
      this.accionConfirmada = 'crear';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Contenido creado con éxito';
    this.contenidoService.crear(this.contenido).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  actualizar() {
if (!this.contenido.Nucleo_Tematico || !this.contenido.Descripcion || this.contenido.Horas <= 0) {
  this.mensajeError = 'Complete todos los campos correctamente.';
  setTimeout(() => this.mensajeError = '', 3000);
  return;
}


    if (!this.accionConfirmada) {
      this.accionConfirmada = 'actualizar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Contenido actualizado correctamente';
    this.contenidoService
      .actualizar(this.contenido.ID_Contenido, this.contenido)
      .subscribe(() => {
        setTimeout(() => this.cerrarConExito(), 1500);
      });
  }

  eliminar() {
    if (!this.accionConfirmada) {
      this.accionConfirmada = 'eliminar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Contenido eliminado';
    this.contenidoService.eliminar(this.contenido.ID_Contenido).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  private cerrarConExito() {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }
}
