import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { IndicadorService } from '../../../services/indicador.service';
import { DialogFormIndicadorComponent } from '../dialog-form-indicador/dialog-form-indicador.component';

@Component({
  selector: 'app-dialog-rubrica',
  standalone: true,
  templateUrl: './dialog-rubrica.component.html',
  styleUrls: ['./dialog-rubrica.component.css'],
  imports: [CommonModule],
})
export class DialogRubricaComponent implements OnInit {
  @Input() contenidoID!: number;

  indicadores: any[] = [];

  constructor(
    public modal: NgbActiveModal,
    private modalService: NgbModal,
    private indicadorService: IndicadorService
  ) {}

  ngOnInit(): void {
    this.cargarRubrica();
  }

  cargarRubrica(): void {
    this.indicadorService.obtenerPorContenido(this.contenidoID).subscribe((data) => {
      this.indicadores = data.map((ind) => ({
        ...ind,
        Criterios: Array.isArray(ind.Criterios)
          ? [...ind.Criterios].sort((a, b) => a.R_Min - b.R_Min)
          : [],
      }));
    });
  }

  agregarIndicador(): void {
    const modalRef = this.modalService.open(DialogFormIndicadorComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.modo = 'crear';
    modalRef.componentInstance.contenidoID = this.contenidoID;
    modalRef.componentInstance.datos = null;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarRubrica();
      })
      .catch(() => {});
  }

  editarIndicador(indicador: any): void {
    const modalRef = this.modalService.open(DialogFormIndicadorComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.modo = 'editar';
    modalRef.componentInstance.contenidoID = this.contenidoID;
    modalRef.componentInstance.datos = indicador;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarRubrica();
      })
      .catch(() => {});
  }

  verIndicador(indicador: any): void {
    const modalRef = this.modalService.open(DialogFormIndicadorComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.modo = 'ver';
    modalRef.componentInstance.contenidoID = this.contenidoID;
    modalRef.componentInstance.datos = indicador;
  }

  get columnasMaximas(): number[] {
    const max = Math.max(...this.indicadores.map((i) => i.Criterios.length), 0);
    return Array.from({ length: max }, (_, i) => i);
  }

  cancelar(): void {
    this.modal.dismiss();
  }
}
