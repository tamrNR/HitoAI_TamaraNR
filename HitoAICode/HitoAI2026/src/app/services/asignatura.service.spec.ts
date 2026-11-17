import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AsignaturaService } from './asignatura.service';

describe('AsignaturaService', () => {
  let service: AsignaturaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AsignaturaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
