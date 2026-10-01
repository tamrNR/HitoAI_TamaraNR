import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogRubricaEvaluacionComponent } from './dialog-rubrica-evaluacion.component';

describe('DialogRubricaEvaluacionComponent', () => {
  let component: DialogRubricaEvaluacionComponent;
  let fixture: ComponentFixture<DialogRubricaEvaluacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogRubricaEvaluacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogRubricaEvaluacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
