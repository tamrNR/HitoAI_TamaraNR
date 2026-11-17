import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { EvaluacionService } from './evaluacion.service';

describe('EvaluacionService', () => {
  let service: EvaluacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EvaluacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
