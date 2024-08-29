import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsSettingsListComponent } from './sms-settings-list.component';

describe('SmsSettingsListComponent', () => {
  let component: SmsSettingsListComponent;
  let fixture: ComponentFixture<SmsSettingsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsSettingsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SmsSettingsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
