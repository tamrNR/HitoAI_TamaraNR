import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProfesorRoutingModule, InicioProfesorComponent } from './profesor.routing';

// Componentes propios del módulo Profesor
import { HomeComponent as HomeProfesorComponent } from './home/home.component';

// Sidebar como componente standalone
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    InicioProfesorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,       // 👈 standalone
    HomeProfesorComponent,  // 👈 standalone
    ProfesorRoutingModule
  ]
})
export class ProfesorModule {}
