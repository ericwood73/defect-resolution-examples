import { TestBed } from '@angular/core/testing';

import { PhotosphereService } from './photosphere.service';

describe('HiPhotosphereService', () => {
  let service: PhotosphereService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotosphereService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
