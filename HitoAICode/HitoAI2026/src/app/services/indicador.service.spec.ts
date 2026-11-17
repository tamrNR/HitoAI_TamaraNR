import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { IndicadorService } from './indicador.service';

describe('IndicadorService', () => {
  let service: IndicadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(IndicadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
