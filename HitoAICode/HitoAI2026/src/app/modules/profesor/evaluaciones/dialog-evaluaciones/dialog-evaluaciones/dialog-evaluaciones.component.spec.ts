import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { DialogEvaluacionesComponent } from './dialog-evaluaciones.component';

describe('DialogEvaluacionesComponent', () => {
  let component: DialogEvaluacionesComponent;
  let fixture: ComponentFixture<DialogEvaluacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogEvaluacionesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: { close: () => {}, dismiss: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogEvaluacionesComponent);
    component = fixture.componentInstance;
    component.asignatura = { ID_Asignatura: 'test' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
