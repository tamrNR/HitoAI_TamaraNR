import { TestBed } from '@angular/core/testing';

import { RaService } from './ra.service';

describe('RaService', () => {
  let service: RaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
