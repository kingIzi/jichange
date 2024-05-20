import { TestBed } from '@angular/core/testing';

import { QuestionNameService } from './question-name.service';

describe('QuestionNameService', () => {
  let service: QuestionNameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionNameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
