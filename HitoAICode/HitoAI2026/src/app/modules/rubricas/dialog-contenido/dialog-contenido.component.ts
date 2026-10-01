import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalModule,
} from '@ng-bootstrap/ng-bootstrap';
import { ContenidoService } from '../../../services/contenido.service';
import { DialogFormContenidoComponent } from '../dialog-form-contenido/dialog-form-contenido.component';
import { DialogRubricaComponent } from '../dialog-rubrica/dialog-rubrica.component';

@Component({
  selector: 'app-dialog-contenido',
  standalone: true,
  templateUrl: './dialog-contenido.component.html',
  styleUrls: ['./dialog-contenido.component.css'],
  imports: [CommonModule, FormsModule, NgbModalModule],
})
export class DialogContenidoComponent implements OnInit {
  @Input() asignaturaID: string = '';
  contenidos: any[] = [];
  bloqueado = false;

  constructor(
    public modal: NgbActiveModal,
    private modalService: NgbModal,
    private contenidoService: ContenidoService
  ) {}

  ngOnInit(): void {
    this.cargarContenidos();
  }

  cargarContenidos() {
    this.contenidoService
      .obtenerPorAsignatura(this.asignaturaID)
      .subscribe((data) => {
        this.contenidos = data;
      });
  }

  nuevaContenido() {
    const modalRef = this.modalService.open(DialogFormContenidoComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.modo = 'crear';
    modalRef.componentInstance.asignaturaID = this.asignaturaID;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarContenidos();
      })
      .catch(() => {});
  }

  verContenido(contenido: any) {
    const modalRef = this.modalService.open(DialogFormContenidoComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.modo = 'ver';
    modalRef.componentInstance.datos = contenido;
  }

  editarContenido(contenido: any) {
    const modalRef = this.modalService.open(DialogFormContenidoComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.modo = 'editar';
    modalRef.componentInstance.datos = contenido;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarContenidos();
      })
      .catch(() => {});
  }

  abrirRubrica(contenido: any) {
    const modalRef = this.modalService.open(DialogRubricaComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.contenidoID = contenido.ID_Contenido;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarContenidos();
      })
      .catch(() => {});
  }

  cancelar() {
    this.modal.dismiss();
  }
}
