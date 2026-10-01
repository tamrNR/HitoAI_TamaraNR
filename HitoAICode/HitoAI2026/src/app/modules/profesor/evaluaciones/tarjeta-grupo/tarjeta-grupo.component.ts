import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogRubricaEvaluacionComponent } from '../dialog-rubrica-evaluacion/dialog-rubrica-evaluacion.component';

@Component({
  selector: 'app-tarjeta-grupo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-grupo.component.html'
})
export class TarjetaGrupoComponent {
  @Input() evaluacionID!: number;
  @Input() asignaturaID!: string;
  @Input() estudiantes: any[] = [];
  @Input() nombreGrupo: string = '';
  @Input() numero!: number;
  @Input() evaluados: Set<number> = new Set();
  @Input() nota: number | null = null;


  constructor(private modalService: NgbModal) {}

  abrirDialog() {
    const modalRef = this.modalService.open(DialogRubricaEvaluacionComponent, {
      centered: true,
      size: 'xl',
      scrollable: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.evaluacionID = this.evaluacionID;
    modalRef.componentInstance.asignaturaID = this.asignaturaID;
    modalRef.componentInstance.estudiantes = this.estudiantes;
    modalRef.componentInstance.nombreGrupo = this.nombreGrupo;
  }
get grupoEvaluado(): boolean {
  return this.estudiantes.every(e => this.evaluados.has(e.ID_Estudiante));
}

get textoBoton(): string {
  return this.grupoEvaluado ? 'Ver Rúbrica' : 'Evaluar';
}

}
