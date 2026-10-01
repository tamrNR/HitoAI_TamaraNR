import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { ThemeService } from '../../services/theme.service';
import { cleanRut, validarRut } from '../../utils/rut';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  usuario = {
    ID_Usuario: '',
    Clave: ''
  };
  mensajeError = '';
  mostrarClave = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  login() {
    const rut = cleanRut(this.usuario.ID_Usuario);
    if (!validarRut(rut)) {
      this.mensajeError = 'RUT inválido';
      setTimeout(() => (this.mensajeError = ''), 3000);
      return;
    }

    this.usuarioService.login({ ID_Usuario: rut, Clave: this.usuario.Clave }).subscribe({
      next: (res: any) => {
        const rol = res?.Rol?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        localStorage.setItem('rol', res.Rol);
        localStorage.setItem('rut', res.ID_Usuario); // En el futuro puedes cambiar 'rut' por 'usuario' si prefieres
        localStorage.setItem('nombre', res.Nombre);

        if (rol === 'administrador') this.router.navigate(['/admin']);
        else if (rol === 'jefe de carrera') this.router.navigate(['/jefe-carrera']);
        else if (rol === 'profesor') this.router.navigate(['/profesor']);
        else if (rol === 'comite curricular') this.router.navigate(['/comite']);
        else alert('⚠️ Rol no reconocido');
      },
      error: (err) => {
        this.mensajeError = err.error?.message || 'Usuario o clave incorrectos';
        setTimeout(() => (this.mensajeError = ''), 3000);
      }
    });
  }

  toggleClave() {
    this.mostrarClave = !this.mostrarClave;
  }


  toggleTheme() {
    this.themeService.toggleDarkMode();
  }
}
