import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { AnaliticaService } from '../../../modules/analitica/services/analitica.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  /**
   * Rol del usuario que controla qué items se muestran.
   * Valores esperados: 'Administrador' | 'Jefe de Carrera' | 'Profesor' | 'Comité Curricular'
   */
  @Input() rol: string = '';
  nombre: string = '';

  constructor(
    private router: Router, 
    public themeService: ThemeService,
    private analiticaService: AnaliticaService
  ) {}

  ngOnInit() {
    this.nombre = localStorage.getItem('nombre') || '';
  }

  toggleTheme() {
    this.themeService.toggleDarkMode();
  }

  cerrarSesion() {
    console.log('[Sidebar] 🚪 Cerrando sesión...');
    
    // Limpiar estado del módulo de analítica
    this.analiticaService.limpiarTodo();
    
    // Limpiar localStorage
    localStorage.clear();
    
    // Redirigir al login
    this.router.navigate(['/login']);
    
    console.log('[Sidebar] ✅ Sesión cerrada correctamente');
  }
}