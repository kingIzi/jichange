import { TestBed } from '@angular/core/testing';

import { CancelledService } from './cancelled.service';

describe('CancelledService', () => {
  let service: CancelledService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CancelledService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
