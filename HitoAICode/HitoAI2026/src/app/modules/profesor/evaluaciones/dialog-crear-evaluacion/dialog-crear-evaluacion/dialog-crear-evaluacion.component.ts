import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EvaluacionService } from '../../../../../services/evaluacion.service';
import { ContenidoService } from '../../../../../services/contenido.service';

@Component({
  selector: 'app-dialog-crear-evaluacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-crear-evaluacion.component.html'
})
export class DialogCrearEvaluacionComponent implements OnInit {
  @Input() asignatura: any;

  nombre = '';
  tipo = '';
  fechaActual = new Date().toISOString().split('T')[0];
  instancia = 1;
  contenidos: any[] = [];
  seleccionados: number[] = [];

  mensajeError = '';
  mensajeExito = '';
  bloqueado = false;

  constructor(
    public modal: NgbActiveModal,
    private evaluacionService: EvaluacionService,
    private contenidoService: ContenidoService
  ) {}

  ngOnInit(): void {
    this.cargarContenidos();
    this.obtenerInstancia();
  }

  cargarContenidos() {
    this.contenidoService
      .obtenerPorAsignatura(this.asignatura.ID_Asignatura)
      .subscribe((data) => {
        this.contenidos = data;
      });
  }

  obtenerInstancia() {
    this.evaluacionService.contarPorAsignatura(this.asignatura.ID_Asignatura).subscribe(count => {
      this.instancia = (count || 0) + 1;
    });
  }

  toggleContenido(id: number) {
    if (this.seleccionados.includes(id)) {
      this.seleccionados = this.seleccionados.filter(c => c !== id);
    } else {
      this.seleccionados.push(id);
    }
  }

  crear() {
    if (!this.nombre || !this.tipo || this.seleccionados.length === 0) {
      this.mensajeError = 'Debes completar todos los campos y seleccionar al menos un contenido.';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }

    this.bloqueado = true;

    const evaluacion = {
      Nombre: this.nombre,
      Tipo: this.tipo,
      N_Instancia: this.instancia,
      Fecha: this.fechaActual,
      asignatura_ID_Asignatura: this.asignatura.ID_Asignatura,
      contenidos: this.seleccionados
    };

    this.evaluacionService.crearConAplicaciones(evaluacion).subscribe({
      next: () => {
        this.mensajeExito = 'Evaluación creada con éxito';
        setTimeout(() => this.modal.close('actualizado'), 1500);
      },
      error: (err) => {
        this.bloqueado = false;
        this.mensajeError = err?.error?.message || 'Error al crear evaluación.';
        setTimeout(() => this.mensajeError = '', 3000);
      }
    });
  }

  cancelar() {
    if (!this.bloqueado) this.modal.dismiss();
  }
}
