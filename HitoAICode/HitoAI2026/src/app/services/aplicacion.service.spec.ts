import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AplicacionService } from './aplicacion.service';

describe('AplicacionService', () => {
  let service: AplicacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AplicacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
