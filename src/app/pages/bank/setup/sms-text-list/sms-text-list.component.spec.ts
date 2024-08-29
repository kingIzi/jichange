import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsTextListComponent } from './sms-text-list.component';

describe('SmsTextListComponent', () => {
  let component: SmsTextListComponent;
  let fixture: ComponentFixture<SmsTextListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmsTextListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SmsTextListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
