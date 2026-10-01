import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { EstudianteService } from '../../../../services/estudiante.service';
import { DialogFormEstudianteComponent } from '../dialog-form-estudiante/dialog-form-estudiante.component';
import { Estudiante } from '../../../../models';
import { RutFormatPipe } from '../../../../pipes/rut-format.pipe';

@Component({
  selector: 'app-dialog-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, RutFormatPipe, NgbDropdownModule],
  templateUrl: './dialog-estudiantes.component.html',
  styleUrls: ['./dialog-estudiantes.component.css']
})
export class DialogEstudiantesComponent implements OnInit {
  estudiantes: Estudiante[] = [];
  bloqueado = false;
  mensajeCSV = '';
  mostrarToastCSV = false;
  vista: 'tarjetas' | 'detalle' = 'tarjetas';
  anioSeleccionado: number | null = null;
  aniosManuales: number[] = [];
  mostrarFormularioAnio = false;
  nuevoAnio: number | null = null;
  mostrarConfirmacionAnio = false;
  editandoAnio: number | null = null;
  anioEditado: string = '';
  mostrarConfirmacionEditarAnio = false;
  titulosPersonalizados: { [anio: number]: string } = {};

  constructor(
    public modal: NgbActiveModal,
    private modalService: NgbModal,
    private estudianteService: EstudianteService
  ) {}

  get aniosConConteo(): { anio: number, cantidad: number }[] {
    const mapa = new Map<number, number>();
    for (const est of this.estudiantes) {
      mapa.set(est.Anio_Ingreso, (mapa.get(est.Anio_Ingreso) || 0) + 1);
    }
    for (const anio of this.aniosManuales) {
      if (!mapa.has(anio)) mapa.set(anio, 0);
    }
    return Array.from(mapa.entries())
      .map(([anio, cantidad]) => ({ anio, cantidad }))
      .sort((a, b) => a.anio - b.anio);
  }

  get estudiantesFiltrados(): Estudiante[] {
    if (this.anioSeleccionado == null) return [];
    return this.estudiantes.filter(e => e.Anio_Ingreso === this.anioSeleccionado);
  }

  tituloDe(anio: number): string {
    return this.titulosPersonalizados[anio] || String(anio);
  }

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes() {
    this.estudianteService.obtenerTodos().subscribe(data => {
      this.estudiantes = data;
    });
  }

  nuevoEstudiante() {
    this.abrirFormulario('crear');
  }

  abrirFormulario(modo: 'crear' | 'ver' | 'editar', est?: Estudiante) {
    const modalRef = this.modalService.open(DialogFormEstudianteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = modo;
    modalRef.componentInstance.datos = modo === 'crear' ? null : est;

    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarEstudiantes();
    }).catch(() => {});
  }

  cargarCSV(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      this.estudianteService.cargarDesdeCSV(archivo).subscribe((resp) => {
        this.mensajeCSV = resp.message || `${resp.agregados} estudiantes agregados y ${resp.rechazados} rechazados por RUT inválido`;
        this.mostrarToastCSV = true;
        this.cargarEstudiantes();

        setTimeout(() => this.mostrarToastCSV = false, 3000);
      });
    }
  }

  cancelar() {
    this.modal.dismiss();
  }

  seleccionarAnio(anio: number) {
    this.anioSeleccionado = anio;
    this.vista = 'detalle';
  }

  volverATarjetas() {
    this.vista = 'tarjetas';
    this.anioSeleccionado = null;
  }

  abrirFormularioAnio() {
    this.nuevoAnio = null;
    this.mostrarFormularioAnio = true;
    this.mostrarConfirmacionAnio = false;
  }

  cancelarFormularioAnio() {
    this.mostrarFormularioAnio = false;
    this.mostrarConfirmacionAnio = false;
    this.nuevoAnio = null;
  }

  solicitarConfirmacionAnio() {
    if (!this.nuevoAnio) return;
    this.mostrarConfirmacionAnio = true;
  }

  confirmarCrearAnio() {
    if (this.nuevoAnio && !this.aniosManuales.includes(this.nuevoAnio)) {
      this.aniosManuales.push(this.nuevoAnio);
    }
    this.mostrarFormularioAnio = false;
    this.mostrarConfirmacionAnio = false;
    this.nuevoAnio = null;
  }

  iniciarEdicionAnio(anio: number) {
    this.editandoAnio = anio;
    this.anioEditado = this.tituloDe(anio);
    this.mostrarConfirmacionEditarAnio = false;
  }

  cancelarEdicionAnio() {
    this.editandoAnio = null;
    this.anioEditado = '';
    this.mostrarConfirmacionEditarAnio = false;
  }

  solicitarConfirmacionEditarAnio() {
    if (!this.anioEditado.trim()) return;
    this.mostrarConfirmacionEditarAnio = true;
  }

  confirmarEditarAnio() {
    if (this.editandoAnio === null || !this.anioEditado.trim()) return;
    this.titulosPersonalizados[this.editandoAnio] = this.anioEditado.trim();
    this.cancelarEdicionAnio();
  }
}
