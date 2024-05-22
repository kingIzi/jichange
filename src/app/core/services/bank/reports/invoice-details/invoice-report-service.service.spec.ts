import { TestBed } from '@angular/core/testing';

import { InvoiceReportServiceService } from './invoice-report-service.service';

describe('InvoiceReportServiceService', () => {
  let service: InvoiceReportServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoiceReportServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
