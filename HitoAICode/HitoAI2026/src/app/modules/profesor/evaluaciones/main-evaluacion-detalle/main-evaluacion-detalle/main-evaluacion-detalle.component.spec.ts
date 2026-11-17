import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { MainEvaluacionDetalleComponent } from './main-evaluacion-detalle.component';

describe('MainEvaluacionDetalleComponent', () => {
  let component: MainEvaluacionDetalleComponent;
  let fixture: ComponentFixture<MainEvaluacionDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainEvaluacionDetalleComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: { close: () => {}, dismiss: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainEvaluacionDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
