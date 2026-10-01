// Módulo de Analítica con ng2-charts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { AnaliticaRoutingModule } from './analitica-routing.module';
import { AnaliticaContainerComponent } from './analitica-container.component';
import { AnGeneralComponent } from './components/an-general/an-general.component';
import { AnEspecificoComponent } from './components/an-especifico/an-especifico.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { SentenceCasePipe } from './pipes/sentence-case.pipe';

@NgModule({
  declarations: [
    AnaliticaContainerComponent,
    AnGeneralComponent,
    AnEspecificoComponent,
    SentenceCasePipe
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective,
    AnaliticaRoutingModule,
    SidebarComponent
  ],
  providers: [
    provideCharts(withDefaultRegisterables())
  ]
})
export class AnaliticaModule { }
