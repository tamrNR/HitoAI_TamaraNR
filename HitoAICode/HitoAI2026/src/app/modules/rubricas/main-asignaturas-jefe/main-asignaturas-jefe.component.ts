import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AsignaturaService } from '../../../services/asignatura.service';
import { DialogContenidoComponent } from '../dialog-contenido/dialog-contenido.component';
import { DialogAsignaturaComponent } from '../../admin/asignaturas/dialog-asignatura/dialog-asignatura.component';
import { DialogUmbralComponent } from '../dialog-umbral/dialog-umbral.component';

@Component({
  selector: 'app-main-asignaturas-jefe',
  standalone: true,
  templateUrl: './main-asignaturas-jefe.component.html',
  styleUrls: ['./main-asignaturas-jefe.component.css'],
  imports: [CommonModule, NgbModalModule, SidebarComponent]
})
export class MainAsignaturasJefeComponent implements OnInit {
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
    const rolNorm = this.rolUsuario.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const esAdmin = rolNorm === 'administrador';

    if (!rut && !esAdmin) return;

    const request = esAdmin
      ? this.asignaturaService.obtenerTodas()
      : this.asignaturaService.obtenerPorCarreraDelJefe(rut!);

    request.subscribe((data) => {
      this.asignaturas = data;
    });
  }

  verAsignatura(asignatura: any) {
    const modalRef = this.modalService.open(DialogAsignaturaComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.modo = 'ver';
    modalRef.componentInstance.datos = asignatura;
    modalRef.componentInstance.puedeDesvincular = false;
  }

  abrirContenidos(asignatura: any) {
    const modalRef = this.modalService.open(DialogContenidoComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static', // ✅ evita cierre al hacer clic fuera
      keyboard: false, // ✅ evita cierre con tecla Esc
    });

    modalRef.componentInstance.asignaturaID = asignatura.ID_Asignatura;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarAsignaturas();
      })
      .catch(() => {});
  }

  abrirUmbral(asignatura: any) {
    const modalRef = this.modalService.open(DialogUmbralComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.asignaturaID = asignatura.ID_Asignatura;
    modalRef.componentInstance.nombreAsignatura = asignatura.Nombre;
    modalRef.componentInstance.umbralActual = asignatura.Umbral;

    modalRef.result
      .then((res) => {
        if (res === 'actualizado') this.cargarAsignaturas();
      })
      .catch(() => {});
  }


}
