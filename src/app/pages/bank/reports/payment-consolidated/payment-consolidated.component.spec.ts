import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentConsolidatedComponent } from './payment-consolidated.component';

describe('PaymentConsolidatedComponent', () => {
  let component: PaymentConsolidatedComponent;
  let fixture: ComponentFixture<PaymentConsolidatedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentConsolidatedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PaymentConsolidatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
