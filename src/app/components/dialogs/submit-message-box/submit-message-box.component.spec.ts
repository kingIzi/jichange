import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitMessageBoxComponent } from './submit-message-box.component';

describe('SubmitMessageBoxComponent', () => {
  let component: SubmitMessageBoxComponent;
  let fixture: ComponentFixture<SubmitMessageBoxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubmitMessageBoxComponent]
    });
    fixture = TestBed.createComponent(SubmitMessageBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
