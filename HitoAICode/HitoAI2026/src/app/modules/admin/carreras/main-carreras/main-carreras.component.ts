import { Component, OnInit } from '@angular/core';
import { NgbModal, NgbModalModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarreraService } from '../../../../services/carrera.service';
import { UsuarioService } from '../../../../services/usuario.service';
import { DialogCarreraComponent } from '../dialog-carrera/dialog-carrera.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { Carrera, Usuario } from '../../../../models';

@Component({
  selector: 'app-main-carreras',
  templateUrl: './main-carreras.component.html',
  styleUrls: ['./main-carreras.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, NgbDropdownModule, SidebarComponent]
})
export class MainCarrerasComponent implements OnInit {
  carreras: Carrera[] = [];
  carrerasFiltradas: Carrera[] = [];
  jefes: Usuario[] = [];
  rolUsuario: string = '';
  filtroTexto: string = '';

  constructor(
    private carreraService: CarreraService,
    private usuarioService: UsuarioService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
    this.cargarCarreras();
    this.cargarJefes();
  }

  cargarCarreras() {
    this.carreraService.getCarreras().subscribe(data => {
      this.carreras = data;
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    const texto = this.filtroTexto.toLowerCase();
    this.carrerasFiltradas = this.carreras.filter(c =>
      c.Nombre.toLowerCase().includes(texto) ||
      (c.JefeCarrera ? c.JefeCarrera.toLowerCase().includes(texto) : false)
    );
  }

  cargarJefes() {
    this.usuarioService.getJefesCarrera().subscribe(data => this.jefes = data);
  }

  abrirDialog(modo: 'crear' | 'ver' | 'editar', carrera?: Carrera) {

    const modalRef = this.modalService.open(DialogCarreraComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = modo;
    modalRef.componentInstance.jefes = this.jefes;
    modalRef.componentInstance.datos = modo === 'crear' ? null : carrera;

    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarCarreras();
    });
  }
}
