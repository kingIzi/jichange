import { TestBed } from '@angular/core/testing';

import { SmsTextService } from './sms-text.service';

describe('SmsTextService', () => {
  let service: SmsTextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmsTextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
