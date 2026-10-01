import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-analitica-container',
  standalone: false,
  template: `
    <div class="main-layout">
      <app-sidebar [rol]="rolUsuario"></app-sidebar>
      <div class="main-content" style="margin-left: 70px;">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: []
})
export class AnaliticaContainerComponent implements OnInit {
  rolUsuario = '';

  ngOnInit(): void {
    this.rolUsuario = localStorage.getItem('rol') || '';
  }
}
