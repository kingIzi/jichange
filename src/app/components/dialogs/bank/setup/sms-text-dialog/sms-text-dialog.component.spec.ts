import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsTextDialogComponent } from './sms-text-dialog.component';

describe('SmsTextDialogComponent', () => {
  let component: SmsTextDialogComponent;
  let fixture: ComponentFixture<SmsTextDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsTextDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SmsTextDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
