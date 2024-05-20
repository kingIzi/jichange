import { TestBed } from '@angular/core/testing';

import { SuspenseAccountService } from './suspense-account.service';

describe('SuspenseAccountService', () => {
  let service: SuspenseAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuspenseAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
