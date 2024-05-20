import { TestBed } from '@angular/core/testing';

import { EmailTextService } from './email-text.service';

describe('EmailTextService', () => {
  let service: EmailTextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailTextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
