import { Component, Input } from '@angular/core';
import { CarreraService } from '../../../../services/carrera.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Carrera, Usuario } from '../../../../models';

@Component({
  selector: 'app-dialog-carrera',
  templateUrl: './dialog-carrera.component.html',
  styleUrls: ['./dialog-carrera.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DialogCarreraComponent {
  @Input() modo: 'crear' | 'ver' | 'editar' = 'crear';
  @Input() datos: Carrera | null = null;
  @Input() jefes: Usuario[] = [];

  carrera: Carrera = {
    Nombre: '',
    usuario_ID_Usuario: '',
    facultad_ID_Facultad: 1
  };

  bloqueado = false;
  mensajeExito = '';
  mensajeError = '';
  estadisticas: { total_estudiantes: number; generaciones: number[] } | null = null;
  cargandoStats = false;
  accionConfirmada: 'crear' | 'actualizar' | 'eliminar' | null = null;
  private modalCerrado = false;

  constructor(public modal: NgbActiveModal, private carreraService: CarreraService) {}

  ngOnInit(): void {
    if (this.datos) {
      this.carrera = {
        Nombre: this.datos.Nombre,
        usuario_ID_Usuario: this.datos.usuario_ID_Usuario || '',
        facultad_ID_Facultad: 1
      };

      if (this.modo === 'ver' && this.datos?.ID_Carrera) {
        this.cargandoStats = true;
        this.carreraService.getEstadisticas(Number(this.datos.ID_Carrera)).subscribe({
          next: (data) => {
            this.estadisticas = data;
            this.cargandoStats = false;
          },
          error: () => {
            this.cargandoStats = false;
          }
        });
      }
    }
  }

  get nombreJefe(): string {
    const jefe = this.jefes.find(j => j.ID_Usuario === this.carrera.usuario_ID_Usuario);
    return jefe ? jefe.Nombre : 'No asignado';
  }

  crearCarrera() {
    if (!this.carrera.Nombre || !this.carrera.usuario_ID_Usuario) {
      this.mensajeError = 'Debe completar todos los campos antes de continuar.';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'crear';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Carrera creada con éxito';
    this.carreraService.crearCarrera(this.carrera).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  actualizarCarrera() {
    if (!this.carrera.Nombre || !this.carrera.usuario_ID_Usuario) {
      this.mensajeError = 'Debe completar todos los campos antes de continuar.';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'actualizar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Carrera actualizada correctamente';
    this.carreraService.actualizarCarrera(this.datos!.ID_Carrera as number, this.carrera).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

eliminarCarrera() {
  if (!this.accionConfirmada) {
    this.accionConfirmada = 'eliminar';
    return;
  }

  this.bloqueado = true;
  this.carreraService.eliminarCarrera(this.datos!.ID_Carrera as number).subscribe({
    next: () => {
      this.mensajeExito = 'Carrera eliminada';
      setTimeout(() => this.cerrarConExito(), 1500);
    },
    error: (err) => {
      this.bloqueado = false;
      if (err.status === 400 && err.error?.message) {
        this.mensajeError = err.error.message;
      } else {
        this.mensajeError = 'No se pudo eliminar la carrera. Tiene datos vinculados.';
      }
      setTimeout(() => this.mensajeError = '', 4000);
    }
  });
}


  cancelarConfirmacion() {
    this.accionConfirmada = null;
  }

  cancelar() {
    this.modal.dismiss();
  }

  cerrarToast() {
    this.cerrarConExito();
  }

  private cerrarConExito() {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }
}
