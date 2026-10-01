import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogEvaluacionesComponent } from './dialog-evaluaciones.component';

describe('DialogEvaluacionesComponent', () => {
  let component: DialogEvaluacionesComponent;
  let fixture: ComponentFixture<DialogEvaluacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogEvaluacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogEvaluacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
