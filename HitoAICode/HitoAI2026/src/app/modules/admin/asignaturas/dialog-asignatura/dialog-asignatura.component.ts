import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AsignaturaService } from '../../../../services/asignatura.service';
import { CarreraService } from '../../../../services/carrera.service';
import { InscripcionService } from '../../../../services/inscripcion.service';
import { UsuarioService } from '../../../../services/usuario.service';

import { Asignatura, Carrera, Usuario, Estudiante } from '../../../../models';
import { RutFormatPipe } from '../../../../pipes/rut-format.pipe';


@Component({
  selector: 'app-dialog-asignatura',
  standalone: true,
  imports: [CommonModule, FormsModule, RutFormatPipe],
  templateUrl: './dialog-asignatura.component.html',
  styleUrls: ['./dialog-asignatura.component.css']
})
export class DialogAsignaturaComponent implements OnInit {
  @Input() modo: 'crear' | 'ver' | 'editar' = 'crear';
  @Input() datos: Asignatura | null = null;
  @Input() puedeDesvincular = true;

  asignatura: Asignatura = {
    ID_Asignatura: '',
    Nombre: '',
    Semestre: 1,
    N_Hito: 1,
    Plan_Academico: new Date().getFullYear(),
    carrera_ID_Carrera: 0,
    usuario_ID_Usuario: '',
    Umbral: null
  };

  carreras: Carrera[] = [];
  profesores: Usuario[] = [];

  estudiantesInscritos: any[] = [];
  estudianteParaDesvincular: any | null = null;


  nombreCarrera = '';
  mensajeExito = '';
  mensajeError = '';
  accionConfirmada: 'crear' | 'actualizar' | 'eliminar' | null = null;
  bloqueado = false;
  private modalCerrado = false;

  constructor(
    public modal: NgbActiveModal,
    private asignaturaService: AsignaturaService,
    private carreraService: CarreraService,
    private inscripcionService: InscripcionService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarCarreras();
    this.cargarProfesores();

    if (this.datos) {
      this.asignatura = { ...this.datos };
      if (this.modo === 'ver' || this.modo === 'editar') {
        this.cargarEstudiantesInscritos(this.datos.ID_Asignatura);
      }
    }
  }

  cargarCarreras() {
    this.carreraService.getCarreras().subscribe(data => {
      this.carreras = data;
      if (this.modo === 'ver') {
        const c = this.carreras.find(c => c.ID_Carrera === this.asignatura.carrera_ID_Carrera);
        this.nombreCarrera = c?.Nombre || '';
      }
    });
  }

  cargarProfesores() {
    this.usuarioService.getProfesores().subscribe(data => {
      this.profesores = data;
    });
  }

  cargarEstudiantesInscritos(id: string) {
    this.inscripcionService.obtenerPorAsignatura(id).subscribe(data => {
      this.estudiantesInscritos = data;
    });
  }

  marcarParaDesvincular(est: Estudiante) {
    if (!this.puedeDesvincular) return;
    this.estudianteParaDesvincular = est;
  }

  confirmarDesvincular() {
    if (!this.puedeDesvincular || !this.estudianteParaDesvincular) return;

    const est = this.estudianteParaDesvincular;
    this.bloqueado = true;
    this.mensajeError = '';

    this.inscripcionService
      .eliminar(this.asignatura.ID_Asignatura, est.ID_Estudiante, est.Anio)
      .subscribe({
        next: () => {
          this.mensajeExito = 'Estudiante desvinculado de la asignatura';
          setTimeout(() => {
            this.bloqueado = false;
            this.mensajeExito = '';
            this.estudianteParaDesvincular = null;
            this.cargarEstudiantesInscritos(this.asignatura.ID_Asignatura);
          }, 1500);
        },
        error: (err) => {
          this.bloqueado = false;
          this.estudianteParaDesvincular = null;
          
          if (err.status === 404) {
            this.mensajeError = 'No se encontró la inscripción especificada o ya está desvinculada.';
          } else {
            this.mensajeError = 'Error al desvincular estudiante. Por favor, intente nuevamente.';
          }
          
          setTimeout(() => (this.mensajeError = ''), 5000);
        }
      });
  }

  cancelarConfirmacion() {
    this.accionConfirmada = null;
    this.estudianteParaDesvincular = null;
  }

  cerrarToast() {
    this.cerrarConExito();
  }

  cancelar() {
    if (!this.bloqueado) this.modal.dismiss();
  }

  crear() {
    if (!this.asignatura.ID_Asignatura || !this.asignatura.Nombre || !this.asignatura.carrera_ID_Carrera || !this.asignatura.usuario_ID_Usuario) {
      this.mensajeError = 'Por favor, complete todos los campos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'crear';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Asignatura creada con éxito';
    this.asignaturaService.crear(this.asignatura).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  actualizar() {
    if (!this.asignatura.Nombre || !this.asignatura.carrera_ID_Carrera || !this.asignatura.usuario_ID_Usuario) {
      this.mensajeError = 'Complete todos los campos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'actualizar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Asignatura actualizada correctamente';
    this.asignaturaService.actualizar(this.asignatura.ID_Asignatura, this.asignatura).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  eliminar() {
    if (!this.accionConfirmada) {
      this.accionConfirmada = 'eliminar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Asignatura eliminada';
    this.asignaturaService
      .eliminar(this.asignatura.ID_Asignatura)
      .subscribe(() => {
        setTimeout(() => this.cerrarConExito(), 1500);
      });
  }

  private cerrarConExito() {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }
}
