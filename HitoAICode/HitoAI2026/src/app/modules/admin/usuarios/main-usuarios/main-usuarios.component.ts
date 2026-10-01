import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { UsuarioService } from '../../../../services/usuario.service';
import { Usuario } from '../../../../models';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { DialogUsuarioComponent } from '../dialog-usuario/dialog-usuario.component';
import { RutFormatPipe } from '../../../../pipes/rut-format.pipe';
import { cleanRut } from '../../../../utils/rut';

@Component({
  selector: 'app-main-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModalModule, SidebarComponent, RutFormatPipe],
  templateUrl: './main-usuarios.component.html',
  styleUrls: ['./main-usuarios.component.css']
})
export class MainUsuariosComponent implements OnInit {
  rolUsuario: string = '';
  agrupados: { rol: string; usuarios: Usuario[] }[] = [];
  usuarios: Usuario[] = [];
  roles: string[] = [];
  filtroId = '';
  filtroTexto = '';
  filtroRol = '';

  constructor(private usuarioService: UsuarioService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe(data => {
      this.usuarios = data;
      this.roles = Array.from(new Set(data.map(u => u.Rol || '')));
      this.aplicarFiltros();
    });
  }

  aplicarFiltros() {
    const idClean = cleanRut(this.filtroId).toLowerCase();
    const texto = this.filtroTexto.toLowerCase();
    const rol = this.filtroRol;

    const filtrados = this.usuarios.filter(u =>
      (!idClean || cleanRut(u.ID_Usuario).toLowerCase().includes(idClean)) &&
      (!texto || u.Nombre.toLowerCase().includes(texto)) &&
      (!rol || u.Rol === rol)
    );

    const mapa: { [k: string]: Usuario[] } = {};
    for (const u of filtrados) {
      const key = u.Rol || 'Sin Rol';
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(u);
    }
    this.agrupados = Object.keys(mapa).map(k => ({ rol: k, usuarios: mapa[k] }));
  }

  abrirDialog(modo: 'crear' | 'ver' | 'editar' | 'rol', usuario?: Usuario) {
    const modalRef = this.modalService.open(DialogUsuarioComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.modo = modo;
    modalRef.componentInstance.datos = modo === 'crear' ? null : usuario!;
    modalRef.result.then(res => {
      if (res === 'actualizado') this.cargarUsuarios();
    }).catch(() => {});
  }
}
