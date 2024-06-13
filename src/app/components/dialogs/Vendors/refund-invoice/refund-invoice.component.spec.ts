import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundInvoiceComponent } from './refund-invoice.component';

describe('RefundInvoiceComponent', () => {
  let component: RefundInvoiceComponent;
  let fixture: ComponentFixture<RefundInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundInvoiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RefundInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
