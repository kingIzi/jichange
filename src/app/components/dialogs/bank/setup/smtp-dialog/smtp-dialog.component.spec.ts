import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmtpDialogComponent } from './smtp-dialog.component';

describe('SmtpDialogComponent', () => {
  let component: SmtpDialogComponent;
  let fixture: ComponentFixture<SmtpDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SmtpDialogComponent]
    });
    fixture = TestBed.createComponent(SmtpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
