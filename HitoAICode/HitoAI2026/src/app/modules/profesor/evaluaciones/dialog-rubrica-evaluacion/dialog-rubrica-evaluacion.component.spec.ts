import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DialogRubricaEvaluacionComponent } from './dialog-rubrica-evaluacion.component';

describe('DialogRubricaEvaluacionComponent', () => {
  let component: DialogRubricaEvaluacionComponent;
  let fixture: ComponentFixture<DialogRubricaEvaluacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogRubricaEvaluacionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: { close: () => {}, dismiss: () => {} } }
      ]
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
