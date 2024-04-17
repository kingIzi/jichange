import { TestBed } from '@angular/core/testing';

import { AuditTrailsService } from './audit-trails.service';

describe('AuditTrailsService', () => {
  let service: AuditTrailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditTrailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
