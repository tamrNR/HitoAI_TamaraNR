import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AsignaturaService } from '../../../services/asignatura.service';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { DialogContenidoComponent } from '../../rubricas/dialog-contenido/dialog-contenido.component';

@Component({
  selector: 'app-main-contenidos',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, SidebarComponent],
  templateUrl: './main-contenidos.component.html'
})
export class MainContenidosComponent implements OnInit {
  rolUsuario = '';
  asignaturas: any[] = [];
  asignaturasFiltradas: any[] = [];
  filtroTexto = '';
  filtroFacultad = '';
  filtroCarrera = '';

  get facultades(): string[] {
    return [...new Set(
      this.asignaturas.map(a => a.Facultad).filter(Boolean)
    )].sort();
  }

  get carreras(): string[] {
    const base = this.filtroFacultad
      ? this.asignaturas.filter(a => a.Facultad === this.filtroFacultad)
      : this.asignaturas;
    return [...new Set(base.map(a => a.Carrera).filter(Boolean))].sort();
  }

  get soloLectura(): boolean {
    const rol = this.rolUsuario.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return rol !== 'comite curricular' && rol !== 'administrador';
  }

  constructor(
    private asignaturaService: AsignaturaService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
    this.cargarAsignaturas();
  }

  cargarAsignaturas() {
    this.asignaturaService.obtenerTodas().subscribe({
      next: (data) => {
        this.asignaturas = data;
        this.aplicarFiltros();
      },
      error: (err) => console.error('Error cargando asignaturas:', err)
    });
  }

  aplicarFiltros() {
    let resultado = this.asignaturas;
    if (this.filtroFacultad) {
      resultado = resultado.filter(a => a.Facultad === this.filtroFacultad);
    }
    if (this.filtroCarrera) {
      resultado = resultado.filter(a => a.Carrera === this.filtroCarrera);
    }
    if (this.filtroTexto.trim()) {
      const t = this.filtroTexto.toLowerCase();
      resultado = resultado.filter(a =>
        a.Nombre?.toLowerCase().includes(t) ||
        a.ID_Asignatura?.toLowerCase().includes(t)
      );
    }
    this.asignaturasFiltradas = resultado;
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroFacultad = '';
    this.filtroCarrera = '';
    this.aplicarFiltros();
  }

  verDetalle(asignatura: any) {
    const modalRef = this.modalService.open(DialogContenidoComponent, {
      centered: true,
      size: 'xl',
      windowClass: 'modal-custom-height',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.asignaturaID = asignatura.ID_Asignatura;
    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarAsignaturas();
    }).catch(() => {});
  }
}
