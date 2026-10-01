import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainEvaluacionDetalleComponent } from './main-evaluacion-detalle.component';

describe('MainEvaluacionDetalleComponent', () => {
  let component: MainEvaluacionDetalleComponent;
  let fixture: ComponentFixture<MainEvaluacionDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainEvaluacionDetalleComponent]
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
