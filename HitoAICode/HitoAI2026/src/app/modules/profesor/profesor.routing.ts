import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';

import { HomeComponent as HomeProfesorComponent } from './home/home.component';
import { MainAsignaturasProfesorComponent } from '../rubricas/main-asignaturas-profesor/main-asignaturas-profesor.component';

// Componente simple para la página de inicio
@Component({
  standalone: false,
  template: `
    <div class="p-4">
      <h2 style="color: #002F5D;">Panel Profesor</h2>
      <p>Bienvenido/a. Aquí podrás gestionar tus evaluaciones asignadas.</p>
    </div>
  `
})
export class InicioProfesorComponent {}

const routes: Routes = [
  {
    path: '',
    component: HomeProfesorComponent,
    children: [
      { path: '', component: InicioProfesorComponent },
      { path: 'asignaturas', component: MainAsignaturasProfesorComponent, data: { role: ['Administrador', 'Profesor'] } }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfesorRoutingModule {}
