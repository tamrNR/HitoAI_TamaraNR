import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CarreraService } from './carrera.service';

describe('CarreraService', () => {
  let service: CarreraService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CarreraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
