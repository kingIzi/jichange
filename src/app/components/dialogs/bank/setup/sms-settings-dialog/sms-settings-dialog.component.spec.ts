import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsSettingsDialogComponent } from './sms-settings-dialog.component';

describe('SmsSettingsDialogComponent', () => {
  let component: SmsSettingsDialogComponent;
  let fixture: ComponentFixture<SmsSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsSettingsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SmsSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
