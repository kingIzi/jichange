import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTextDialogComponent } from './email-text-dialog.component';

describe('EmailTextDialogComponent', () => {
  let component: EmailTextDialogComponent;
  let fixture: ComponentFixture<EmailTextDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmailTextDialogComponent]
    });
    fixture = TestBed.createComponent(EmailTextDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
