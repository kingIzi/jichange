import { TestBed } from '@angular/core/testing';

import { SmsSettingsService } from './sms-settings.service';

describe('SmsSettingsService', () => {
  let service: SmsSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmsSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
