import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionNameListComponent } from './question-name-list.component';

describe('QuestionNameListComponent', () => {
  let component: QuestionNameListComponent;
  let fixture: ComponentFixture<QuestionNameListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionNameListComponent]
    });
    fixture = TestBed.createComponent(QuestionNameListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
