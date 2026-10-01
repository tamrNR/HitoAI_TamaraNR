import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';


import { AsignaturaService } from '../../../services/asignatura.service';
import { DialogEvaluacionesComponent } from '../../profesor/evaluaciones/dialog-evaluaciones/dialog-evaluaciones/dialog-evaluaciones.component';
import { DialogAsignaturaComponent } from '../../admin/asignaturas/dialog-asignatura/dialog-asignatura.component';

@Component({
  selector: 'app-main-asignaturas-profesor',
  standalone: true,
  templateUrl: './main-asignaturas-profesor.component.html',
  styleUrls: ['./main-asignaturas-profesor.component.css'],
  imports: [CommonModule, NgbModalModule]
})
export class MainAsignaturasProfesorComponent implements OnInit {
  rolUsuario = '';
  asignaturas: any[] = [];

  constructor(
    private modalService: NgbModal,
    private asignaturaService: AsignaturaService
  ) {}

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
    this.cargarAsignaturas();
  }

  cargarAsignaturas() {
    const rut = localStorage.getItem('rut');
    if (!rut) {
      console.warn('❌ RUT del profesor no encontrado en localStorage');
      return;
    }

    this.asignaturaService.obtenerPorProfesor(rut).subscribe(
      (data) => {
        this.asignaturas = data;
      },
      (error) => {
        console.error('❌ Error al cargar asignaturas del profesor:', error);
      }
    );
  }

  verAsignatura(asignatura: any) {
    const modalRef = this.modalService.open(DialogAsignaturaComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = 'ver';
    modalRef.componentInstance.datos = asignatura;
    modalRef.componentInstance.puedeDesvincular = false;
  }

  abrirEvaluaciones(asignatura: any) {
    const modalRef = this.modalService.open(DialogEvaluacionesComponent, {
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.asignatura = asignatura;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarAsignaturas();
      })
      .catch(() => {});
  }
}
