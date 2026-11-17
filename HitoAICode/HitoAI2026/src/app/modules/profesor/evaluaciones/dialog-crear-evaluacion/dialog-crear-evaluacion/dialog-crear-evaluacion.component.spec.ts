import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DialogCrearEvaluacionComponent } from './dialog-crear-evaluacion.component';

describe('DialogCrearEvaluacionComponent', () => {
  let component: DialogCrearEvaluacionComponent;
  let fixture: ComponentFixture<DialogCrearEvaluacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogCrearEvaluacionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: { close: () => {}, dismiss: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCrearEvaluacionComponent);
    component = fixture.componentInstance;
    component.asignatura = { ID_Asignatura: 'test' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
