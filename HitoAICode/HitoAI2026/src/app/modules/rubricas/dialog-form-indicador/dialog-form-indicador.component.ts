import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IndicadorService } from '../../../services/indicador.service';
import { RaService } from '../../../services/ra.service';
import { ResultadoAprendizaje } from '../../../models/resultado-aprendizaje.model';

@Component({
  selector: 'app-dialog-form-indicador',
  standalone: true,
  templateUrl: './dialog-form-indicador.component.html',
  styleUrls: ['./dialog-form-indicador.component.css'],
  imports: [CommonModule, FormsModule]
})
export class DialogFormIndicadorComponent implements OnInit {
  @Input() modo: 'crear' | 'ver' | 'editar' = 'crear';
  @Input() datos: any = null;
  @Input() contenidoID: number = 0;

  indicador = {
    ID_Indicador: 0,
    Descripcion: '',
    Puntaje_Max: 0,
    contenido_ID_Contenido: 0,
    ra_ID_RA: 0,
    Criterios: [] as { Nombre: string; R_Min: number; R_Max: number }[]
  };

  ras: ResultadoAprendizaje[] = [];

  mensajeExito = '';
  mensajeError = '';
  accionConfirmada: 'crear' | 'actualizar' | 'eliminar' | null = null;
  bloqueado = false;
  private modalCerrado = false;

  constructor(
    public modal: NgbActiveModal,
    private indicadorService: IndicadorService,
    private raService: RaService
  ) {}
ngOnInit(): void {
  console.log('🧪 contenidoID recibido:', this.contenidoID); // <-- esto

  this.cargarRAs();

  if (this.datos) {
    this.indicador = {
      ...this.datos,
      Criterios: Array.isArray(this.datos.Criterios) ? [...this.datos.Criterios] : []
    };
  } else {
    this.indicador.contenido_ID_Contenido = this.contenidoID;
    const copia = localStorage.getItem('criteriosReferencia');
    if (copia) {
      try {
        this.indicador.Criterios = JSON.parse(copia);
      } catch (e) {}
    }
    if (this.indicador.Criterios.length < 4) {
      for (let i = this.indicador.Criterios.length; i < 4; i++) {
        this.indicador.Criterios.push({ Nombre: '', R_Min: 1, R_Max: 1 });
      }
    }
  }
}


  cargarRAs() {
    if (!this.contenidoID) return;

    this.raService.obtenerPorAsignaturaDesdeContenido(this.contenidoID).subscribe(data => {
      console.log('RA por contenido:', data);
      this.ras = data;
    });
  }

  getNombreRA(): string {
    const ra = this.ras.find(r => r.ID_RA === this.indicador.ra_ID_RA);
    return ra ? ra.Nombre : 'No asignado';
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

  agregarCriterio() {
    this.indicador.Criterios.push({ Nombre: '', R_Min: 1, R_Max: 1 });
  }

  eliminarCriterio(index: number) {
    this.indicador.Criterios.splice(index, 1);
  }

  validarRangosCompletos(): boolean {
    const totalEsperado = this.indicador.Puntaje_Max;
    const rangos = this.indicador.Criterios.map(c => ({ ...c })).sort((a, b) => a.R_Min - b.R_Min);

    for (const r of rangos) {
      if (!r.Nombre || r.R_Min == null || r.R_Max == null || r.R_Min > r.R_Max) {
        return false;
      }
    }

    let actual = 1;
    for (const r of rangos) {
      if (r.R_Min !== actual) return false;
      actual = r.R_Max + 1;
    }

    return actual - 1 === totalEsperado;
  }

  crear() {
    if (!this.indicador.Descripcion || this.indicador.Puntaje_Max <= 0 || !this.indicador.ra_ID_RA) {
      this.mensajeError = 'Complete todos los campos obligatorios.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.validarRangosCompletos()) {
      this.mensajeError = 'Verifique que todos los criterios sean válidos y cubran el puntaje máximo sin huecos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'crear';
      return;
    }

    localStorage.setItem('criteriosReferencia', JSON.stringify(this.indicador.Criterios));

    this.bloqueado = true;
    this.mensajeExito = 'Indicador creado con éxito';
    this.indicadorService.crear(this.indicador, this.indicador.Criterios).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  actualizar() {
    if (!this.indicador.Descripcion || !this.indicador.ra_ID_RA) {
      this.mensajeError = 'Complete todos los campos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.validarRangosCompletos()) {
      this.mensajeError = 'Verifique que todos los criterios sean válidos y cubran el puntaje máximo sin huecos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'actualizar';
      return;
    }

    this.bloqueado = true;
    this.mensajeExito = 'Indicador actualizado correctamente';
    this.indicadorService
      .actualizar(this.indicador.ID_Indicador, this.indicador, this.indicador.Criterios)
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
    this.mensajeExito = 'Indicador eliminado';
    this.indicadorService.eliminar(this.indicador.ID_Indicador).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  private cerrarConExito() {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }
}
