/**
 * Módulo de rutas para Analítica
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnaliticaContainerComponent } from './analitica-container.component';
import { AnGeneralComponent } from './components/an-general/an-general.component';
import { AnEspecificoComponent } from './components/an-especifico/an-especifico.component';

const routes: Routes = [
  {
    path: '',
    component: AnaliticaContainerComponent,
    children: [
      {
        path: '',
        redirectTo: 'general',
        pathMatch: 'full'
      },
      {
        path: 'general',
        component: AnGeneralComponent
      },
      {
        path: 'detalle/:grafico',
        component: AnEspecificoComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnaliticaRoutingModule { }
