import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { CompetenciaService } from '../../../services/competencia.service';
import { DialogFormCompetenciaComponent } from '../dialog-form-competencia/dialog-form-competencia.component';

@Component({
  selector: 'app-dialog-competencia',
  standalone: true,
  templateUrl: './dialog-competencia.component.html',
  styleUrls: ['./dialog-competencia.component.css'],
  imports: [CommonModule, FormsModule]
})
export class DialogCompetenciaComponent implements OnInit {
  competencias: any[] = [];
  competenciasPorTipo: { [key: string]: any[] } = {};
  bloqueado = false;

  readonly tipos = ['CP', 'CG', 'CS', 'CD'];
  readonly etiquetas: any = {
    CP: 'Competencia Profesional',
    CG: 'Competencia Genérica',
    CS: 'Competencia de Sello',
    CD: 'Competencia Disciplinar'
  };

  constructor(
    public modal: NgbActiveModal,
    private competenciaService: CompetenciaService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.cargarCompetencias();
  }

  cargarCompetencias() {
    this.competenciaService.obtenerTodas().subscribe(data => {
      this.competencias = data;
      this.agruparCompetencias();
    });
  }

  agruparCompetencias() {
    this.competenciasPorTipo = {};
    this.tipos.forEach(tipo => {
      this.competenciasPorTipo[tipo] = this.competencias.filter(c => c.Tipo === tipo);
    });
  }

  nuevaCompetencia() {
    const modalRef = this.modalService.open(DialogFormCompetenciaComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = 'crear';
    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarCompetencias();
    }).catch(() => {});
  }

  verCompetencia(comp: any) {
    const modalRef = this.modalService.open(DialogFormCompetenciaComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = 'ver';
    modalRef.componentInstance.datos = comp;
  }

  editarCompetencia(comp: any) {
    const modalRef = this.modalService.open(DialogFormCompetenciaComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = 'editar';
    modalRef.componentInstance.datos = comp;
    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarCompetencias();
    }).catch(() => {});
  }

  cancelar() {
    this.modal.dismiss();
  }
}
