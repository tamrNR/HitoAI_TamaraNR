/**
 * Módulo de rutas para Analítica
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/auth.guard';
import { AnaliticaContainerComponent } from './analitica-container.component';
import { AnGeneralComponent } from './components/an-general/an-general.component';
import { AnEspecificoComponent } from './components/an-especifico/an-especifico.component';

// El padre (app.routes) ya exige uno de estos roles; se repite en hijos por defensa en profundidad
const ROLES = ['Administrador', 'Jefe de Carrera', 'Comité Curricular', 'Decano'];

const routes: Routes = [
  {
    path: '',
    component: AnaliticaContainerComponent,
    canActivate: [AuthGuard],
    data: { role: ROLES },
    children: [
      {
        path: '',
        redirectTo: 'general',
        pathMatch: 'full'
      },
      {
        path: 'general',
        component: AnGeneralComponent,
        canActivate: [AuthGuard],
        data: { role: ROLES }
      },
      {
        path: 'detalle/:grafico',
        component: AnEspecificoComponent,
        canActivate: [AuthGuard],
        data: { role: ROLES }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnaliticaRoutingModule { }
