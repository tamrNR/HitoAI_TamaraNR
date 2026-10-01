import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { DialogAsignaturaComponent } from '../dialog-asignatura/dialog-asignatura.component';
import { DialogInscripcionComponent } from '../dialog-inscripcion/dialog-inscripcion.component';
import { DialogEstudiantesComponent } from '../dialog-estudiantes/dialog-estudiantes.component';
import { AsignaturaService } from '../../../../services/asignatura.service';
import { Asignatura } from '../../../../models';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-asignaturas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, NgbDropdownModule, SidebarComponent],
  templateUrl: './main-asignaturas.component.html',
  styleUrls: ['./main-asignaturas.component.css']
})
export class MainAsignaturasComponent implements OnInit {
  rolUsuario: string = '';
  asignaturasPorCarrera: { carrera: string; asignaturas: Asignatura[] }[] = [];
  asignaturas: Asignatura[] = [];
  filtroTexto: string = '';

  constructor(
    private modalService: NgbModal,
    private asignaturaService: AsignaturaService
  ) {}

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
    this.cargarAsignaturas();
  }

  cargarAsignaturas() {
    this.asignaturaService.obtenerTodas().subscribe(data => {
      this.asignaturas = data;
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    const texto = this.filtroTexto.toLowerCase();
    const filtradas = this.asignaturas.filter(a =>
      a.ID_Asignatura.toLowerCase().includes(texto) ||
      a.Nombre.toLowerCase().includes(texto)
    );
    const agrupadas: { [key: string]: Asignatura[] } = {};
    for (const a of filtradas) {
      const key = a.Carrera || '';
      if (!agrupadas[key]) agrupadas[key] = [];
      agrupadas[key].push(a);
    }
    this.asignaturasPorCarrera = Object.keys(agrupadas).map(k => ({
      carrera: k,
      asignaturas: agrupadas[k]
    }));
  }

  abrirDialog(modo: 'crear' | 'ver' | 'editar', asignatura?: Asignatura) {

    const modalRef = this.modalService.open(DialogAsignaturaComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = modo;
    modalRef.componentInstance.datos = modo === 'crear' ? null : asignatura;


    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarAsignaturas();
    }).catch(() => {});
  }

  abrirDialogInscripcion(asignatura: Asignatura) {
    const modalRef = this.modalService.open(DialogInscripcionComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.asignatura = asignatura;

    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarAsignaturas();
    }).catch(() => {});
  }

  abrirDialogEstudiantes() {
    const modalRef = this.modalService.open(DialogEstudiantesComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.catch(() => {});
  }
}
