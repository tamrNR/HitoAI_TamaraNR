import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RaService } from '../../../services/ra.service';

import { CompetenciaService } from '../../../services/competencia.service';
import { Competencia } from '../../../models/competencia.model';

import { AsignaturaService } from '../../../services/asignatura.service';
import { ResultadoAprendizaje } from '../../../models/resultado-aprendizaje.model';
import { Asignatura } from '../../../models/asignatura.model';

@Component({
  selector: 'app-dialog-ra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-ra.component.html',
  styleUrls: ['./dialog-ra.component.css']
})
export class DialogRaComponent implements OnInit {
  @Input() modo: 'crear' | 'ver' | 'editar' = 'crear';
  @Input() datos: ResultadoAprendizaje | null = null;

  competencias: Competencia[] = [];
  asignaturas: Asignatura[] = [];
  competenciasSeleccionadas: string[] = [];

  ra: ResultadoAprendizaje = {

    ID_RA: 0,

    Nombre: '',
    Descripcion: '',
    asignatura_ID_Asignatura: ''
  };

  bloqueado = false;
  mensajeExito = '';
  mensajeError = '';
  accionConfirmada: 'crear' | 'actualizar' | 'eliminar' | null = null;
  private modalCerrado = false;

  constructor(
    public modal: NgbActiveModal,
    private raService: RaService,
    private competenciaService: CompetenciaService,
    private asignaturaService: AsignaturaService
  ) {}

  ngOnInit(): void {
    const rut = localStorage.getItem('rut') || '';
    const rol = localStorage.getItem('rol') || '';
    const rolNorm = rol.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Administrador y Comité Curricular ven todas las asignaturas
    if (rolNorm === 'administrador' || rolNorm === 'comite curricular') {
      this.asignaturaService.obtenerTodas().subscribe({
        next: (respuesta) => {
          this.asignaturas = Array.isArray(respuesta) ? respuesta : [];
        },
        error: (error) => {
          console.error('[DialogRA] Error al cargar asignaturas (todas):', error);
          this.asignaturas = [];
        }
      });
    } else if (rut && rolNorm === 'jefe de carrera') {
      // Jefe de Carrera ve asignaturas de su carrera
      this.asignaturaService.obtenerPorCarreraDelJefe(rut).subscribe({
        next: (respuesta) => {
          this.asignaturas = Array.isArray(respuesta) ? respuesta : [];
        },
        error: (error) => {
          console.error('[DialogRA] Error al cargar asignaturas (por jefe):', error);
          this.asignaturas = [];
        }
      });
    } else {
      this.asignaturas = [];
    }

    this.competenciaService.obtenerTodas().subscribe({
      next: (data) => {
        this.competencias = data;
      },
      error: (error) => {
        console.error('[DialogRA] Error al cargar competencias:', error);
        this.competencias = [];
      }
    });

    if (this.datos) {
      this.ra = {
        ID_RA: this.datos.ID_RA,
        Nombre: this.datos.Nombre,
        Descripcion: this.datos.Descripcion,
        asignatura_ID_Asignatura: this.datos.asignatura_ID_Asignatura
      };
      const comp = this.datos.competencias;
      this.competenciasSeleccionadas = Array.isArray(comp)
        ? comp
        : typeof comp === 'string'
          ? comp.split(' + ')
          : [];
    }
  }

  toggleSeleccion(id: string) {
    const i = this.competenciasSeleccionadas.indexOf(id);
    if (i === -1) {
      this.competenciasSeleccionadas.push(id);
    } else {
      this.competenciasSeleccionadas.splice(i, 1);
    }
  }

  mostrarSeleccionadas(): string {
    return this.competencias
      .filter(c => this.competenciasSeleccionadas.includes(c.ID_Competencia))
      .map(c => c.ID_Competencia)
      .join(' + ');
  }

  crearRA() {
    if (!this.ra.Nombre || !this.ra.Descripcion || !this.ra.asignatura_ID_Asignatura || this.competenciasSeleccionadas.length === 0) {
      this.mensajeError = 'Por favor, complete todos los campos antes de continuar.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'crear';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Resultado de aprendizaje creado con éxito';

    const { ID_RA, ...raSinID } = this.ra;
    const payload = { ...raSinID, competencias: this.competenciasSeleccionadas };

    this.raService.crear(payload).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  actualizarRA() {
    if (!this.ra.Nombre || !this.ra.Descripcion || !this.ra.asignatura_ID_Asignatura || this.competenciasSeleccionadas.length === 0) {
      this.mensajeError = 'Por favor, complete todos los campos antes de continuar.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'actualizar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Resultado actualizado correctamente';

    const payload = { ...this.ra, competencias: this.competenciasSeleccionadas };
    this.raService.actualizar(this.ra.ID_RA!, payload).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  eliminarRA() {
    if (!this.accionConfirmada) {
      this.accionConfirmada = 'eliminar';
      return;
    }

    this.bloqueado = true;
    this.raService.eliminar(this.ra.ID_RA!).subscribe({
      next: () => {
        this.mensajeExito = 'Resultado eliminado';
        setTimeout(() => this.cerrarConExito(), 1500);
      },
      error: (err) => {
        this.bloqueado = false;
        this.accionConfirmada = null;
        this.mensajeError = err.error?.message || 'Error al eliminar RA';
        setTimeout(() => (this.mensajeError = ''), 3000);
      },
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
