import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionNameDialogComponent } from './question-name-dialog.component';

describe('QuestionNameDialogComponent', () => {
  let component: QuestionNameDialogComponent;
  let fixture: ComponentFixture<QuestionNameDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionNameDialogComponent]
    });
    fixture = TestBed.createComponent(QuestionNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
