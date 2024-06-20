import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeliveryCodeComponent } from './confirm-delivery-code.component';

describe('ConfirmDeliveryCodeComponent', () => {
  let component: ConfirmDeliveryCodeComponent;
  let fixture: ComponentFixture<ConfirmDeliveryCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeliveryCodeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfirmDeliveryCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
