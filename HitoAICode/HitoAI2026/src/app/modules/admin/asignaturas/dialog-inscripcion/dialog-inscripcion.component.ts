import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EstudianteService } from '../../../../services/estudiante.service';
import { InscripcionService } from '../../../../services/inscripcion.service';
import { Asignatura, Estudiante, Inscripcion } from '../../../../models';
import { RutFormatPipe } from '../../../../pipes/rut-format.pipe';
import { cleanRut } from '../../../../utils/rut';


@Component({
  selector: 'app-dialog-inscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule, RutFormatPipe],
  templateUrl: './dialog-inscripcion.component.html',
  styleUrls: ['./dialog-inscripcion.component.css']
})
export class DialogInscripcionComponent implements OnInit {
  @Input() asignatura!: Asignatura;

  estudiantes: (Estudiante & { seleccionado: boolean })[] = [];
  filtro: string = '';
  mensajeExito = '';
  bloqueado = false;
  private modalCerrado = false;
  vista: 'tarjetas' | 'detalle' = 'tarjetas';
  anioSeleccionado: number | null = null;
  anioCursada: number = new Date().getFullYear();
  private anioCursadaSubject = new Subject<number>();

  constructor(
    public modal: NgbActiveModal,
    private estudianteService: EstudianteService,
    private inscripcionService: InscripcionService
  ) {}

  ngOnInit(): void {
    this.cargarEstudiantesDisponibles(this.anioCursada);
    this.anioCursadaSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(anio => {
      this.cargarEstudiantesDisponibles(anio);
    });
  }

  get aniosConConteo(): { anio: number, cantidad: number }[] {
    const mapa = new Map<number, number>();
    for (const est of this.estudiantes) {
      mapa.set(est.Anio_Ingreso, (mapa.get(est.Anio_Ingreso) || 0) + 1);
    }
    return Array.from(mapa.entries())
      .map(([anio, cantidad]) => ({ anio, cantidad }))
      .sort((a, b) => a.anio - b.anio);
  }

  get anioMinimoValido(): number {
    const seleccionados = this.estudiantes.filter(e => e.seleccionado);
    if (seleccionados.length === 0) return 2000; // sin selección, no hay restricción aún
    return Math.max(...seleccionados.map(e => e.Anio_Ingreso));
  }

  get anioMaximoValido(): number {
    return new Date().getFullYear() + 1;
  }

  get todosSeleccionados(): boolean {
    const visibles = this.estudiantesFiltrados();
    return visibles.length > 0 && visibles.every(e => e.seleccionado);
  }

  cargarEstudiantesDisponibles(anio?: number): void {
    const idsSeleccionados = new Set(this.estudiantes.filter(e => e.seleccionado).map(e => e.ID_Estudiante));
    this.estudianteService.obtenerDisponibles(this.asignatura.ID_Asignatura, anio).subscribe(data => {
      this.estudiantes = data.map(e => ({ ...e, seleccionado: idsSeleccionados.has(e.ID_Estudiante) }));
    });
  }

  estudiantesFiltrados() {
    const f = this.filtro.toLowerCase();
    const fRut = cleanRut(this.filtro).toLowerCase();
    return this.estudiantes.filter(e =>
      e.Anio_Ingreso === this.anioSeleccionado &&
      (cleanRut(e.ID_Estudiante).toLowerCase().includes(fRut) ||
       e.Nombre.toLowerCase().includes(f) ||
       e.Apellido.toLowerCase().includes(f))
    );
  }

  haySeleccionados(): boolean {
    return this.estudiantes.some(e => e.seleccionado);
  }

  confirmarInscripcion() {
    if (!this.haySeleccionados()) return;
    if (this.anioCursada < this.anioMinimoValido) {
      alert(`El año de cursada no puede ser menor a ${this.anioMinimoValido} (año de ingreso del estudiante más antiguo seleccionado).`);
      return;
    }

    const seleccionados = this.estudiantes
      .filter(e => e.seleccionado)
      .map(e => e.ID_Estudiante);

    const inscripciones = seleccionados.map(id => ({
      estudiante_ID_Estudiante: id,
      asignatura_ID_Asignatura: this.asignatura.ID_Asignatura,
      Anio: this.anioCursada,
      Semestre: this.asignatura.Semestre
    }));

    this.bloqueado = true;
    this.mensajeExito = 'Estudiantes inscritos correctamente';

    this.inscripcionService.inscribir(inscripciones).subscribe(() => {
      setTimeout(() => this.cerrarConExito(), 1500);
    });
  }

  cerrarToast() {
    this.cerrarConExito();
  }

  cancelar() {
    if (!this.bloqueado) this.modal.dismiss();
  }

  private cerrarConExito() {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }

  seleccionarAnio(anio: number) {
    this.anioSeleccionado = anio;
    this.vista = 'detalle';
  }

  volverATarjetas() {
    this.vista = 'tarjetas';
    this.anioSeleccionado = null;
  }

  toggleTodos(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.estudiantesFiltrados().forEach(e => e.seleccionado = checked);
  }

  onAnioCursadaChange(): void {
    this.anioCursadaSubject.next(this.anioCursada);
  }
}
