import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UsuarioService } from '../../../../services/usuario.service';
import { RolService } from '../../../../services/rol.service';
import { FacultadService } from '../../../../services/facultad.service';
import { Usuario, Rol } from '../../../../models';
import { cleanRut, validarRut } from '../../../../utils/rut';
import { RutFormatPipe } from '../../../../pipes/rut-format.pipe';
import { claveSegura } from '../../../../utils/clave';

@Component({
  selector: 'app-dialog-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, RutFormatPipe],
  templateUrl: './dialog-usuario.component.html',
  styleUrls: ['./dialog-usuario.component.css']
})
export class DialogUsuarioComponent {
  @Input() modo: 'crear' | 'ver' | 'editar' | 'rol' = 'ver';
  @Input() datos: Usuario | null = null;

  usuario: Usuario = { ID_Usuario: '', Nombre: '', Rol: '', Clave: '', Rol_ID_Rol: '' };
  roles: Rol[] = [];
  nuevaClave = '';
  confirmar = '';
  mostrarClave = false;

  mostrarNueva = false;
  mostrarConfirmar = false;

  mensajeExito = '';
  mensajeError = '';
  bloqueado = false;
  accionConfirmada: 'crear' | 'actualizar' | 'rol' | 'eliminar' | null = null;
  private modalCerrado = false;

  facultades: { ID_Facultad: number; Nombre: string }[] = [];

  constructor(
    public modal: NgbActiveModal,
    private usuarioService: UsuarioService,
    private rolService: RolService,
    private facultadService: FacultadService
  ) {}

  private normalizar(s: string): string {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  get rolSeleccionadoEsDecano(): boolean {
    const rol = this.roles.find(r => String(r.ID_Rol) === String(this.usuario.Rol_ID_Rol));
    return this.normalizar(rol?.Nombre || '') === 'decano';
  }

  ngOnInit(): void {
    if (this.modo === 'crear' || this.modo === 'rol') {
      this.rolService.getRoles().subscribe({
        next: data => (this.roles = data),
        error: () => (this.mensajeError = 'Error al cargar roles')
      });
      this.facultadService.getAll().subscribe({
        next: data => (this.facultades = data || []),
        error: () => (this.mensajeError = 'Error al cargar facultades')
      });
    }
    if (this.datos) {
      this.usuario = { ...this.datos };
    }
  }

  renovarClave() {
    if (!this.nuevaClave || !this.confirmar) {
      this.mensajeError = 'Debe ingresar la nueva clave en ambos campos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }
    if (!claveSegura(this.nuevaClave)) {
      this.mensajeError =
        'La clave debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, números y símbolos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }
    if (this.nuevaClave !== this.confirmar) {
      this.mensajeError = 'Las claves no coinciden.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }
    if (!this.accionConfirmada) {
      this.accionConfirmada = 'actualizar';
      return;
    }

    if (this.bloqueado) return;
    this.bloqueado = true;
    this.usuarioService
      .actualizarClave(this.usuario.ID_Usuario, this.nuevaClave)
      .subscribe(() => {
        this.mensajeExito = 'Clave actualizada';
        setTimeout(() => this.cerrarConExito(), 1500);
      });
  }

  crear() {
    if (
      !this.usuario.ID_Usuario ||
      !this.usuario.Nombre ||
      !this.usuario.Clave ||
      !this.usuario.Rol_ID_Rol
    ) {
      this.mensajeError = 'Complete todos los campos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!claveSegura(this.usuario.Clave)) {
      this.mensajeError =
        'La clave debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas, números y símbolos.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!validarRut(this.usuario.ID_Usuario)) {
      this.mensajeError = 'RUT inválido';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (this.rolSeleccionadoEsDecano && (this.usuario.Facultad_ID_Facultad === undefined || this.usuario.Facultad_ID_Facultad === null || this.usuario.Facultad_ID_Facultad === '')) {
      this.mensajeError = 'Debe seleccionar una facultad para el rol Decano.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    this.usuario.ID_Usuario = cleanRut(this.usuario.ID_Usuario);

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'crear';
      return;
    }

    if (this.bloqueado) return;
    this.bloqueado = true;
    this.usuarioService.crearUsuario(this.usuario).subscribe({
      next: () => {
        this.mensajeExito = 'Usuario creado';
        setTimeout(() => this.cerrarConExito(), 1500);
      },
      error: (err) => {
        this.bloqueado = false;
        this.mensajeError = err.error?.message || 'Error al crear usuario';
        setTimeout(() => (this.mensajeError = ''), 3000);
      }
    });
  }

  cambiarRol() {
    if (!this.usuario.Rol_ID_Rol) {
      this.mensajeError = 'Seleccione un rol.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (this.rolSeleccionadoEsDecano && (this.usuario.Facultad_ID_Facultad === undefined || this.usuario.Facultad_ID_Facultad === null || this.usuario.Facultad_ID_Facultad === '')) {
      this.mensajeError = 'Debe seleccionar una facultad para el rol Decano.';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    if (!this.accionConfirmada) {
      this.accionConfirmada = 'rol';
      return;
    }

    if (this.bloqueado) return;
    this.bloqueado = true;
    this.usuarioService
      .actualizarRol(this.usuario.ID_Usuario, String(this.usuario.Rol_ID_Rol), this.usuario.Facultad_ID_Facultad ?? null)
      .subscribe(() => {
        this.mensajeExito = 'Rol actualizado';
        setTimeout(() => this.cerrarConExito(), 1500);
      });
  }

  eliminarUsuario() {
    if (!this.accionConfirmada) {
      this.accionConfirmada = 'eliminar';
      return;
    }

    if (this.bloqueado) return;
    this.bloqueado = true;
    this.usuarioService.eliminar(this.usuario.ID_Usuario).subscribe({
      next: () => {
        this.mensajeExito = 'Usuario eliminado';
        setTimeout(() => this.cerrarConExito(), 1500);
      },
      error: () => {
        this.bloqueado = false;
        this.mensajeError = 'No se pudo eliminar el usuario';
        setTimeout(() => (this.mensajeError = ''), 3000);
      }
    });
  }

  cancelar() {
    if (!this.bloqueado) this.modal.dismiss();
  }

  cancelarConfirmacion() {
    this.accionConfirmada = null;
  }

  cerrarToast() {
    this.cerrarConExito();
  }

  private cerrarConExito() {
    if (this.modalCerrado) return;
    this.modalCerrado = true;
    this.modal.close('actualizado');
  }
}
