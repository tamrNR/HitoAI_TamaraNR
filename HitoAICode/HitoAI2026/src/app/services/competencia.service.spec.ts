import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CompetenciaService } from './competencia.service';

describe('CompetenciaService', () => {
  let service: CompetenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CompetenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
