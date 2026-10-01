import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCrearEvaluacionComponent } from './dialog-crear-evaluacion.component';

describe('DialogCrearEvaluacionComponent', () => {
  let component: DialogCrearEvaluacionComponent;
  let fixture: ComponentFixture<DialogCrearEvaluacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogCrearEvaluacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCrearEvaluacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
