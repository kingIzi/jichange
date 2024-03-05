import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerReceiptDialogComponent } from './customer-receipt-dialog.component';

describe('CustomerReceiptDialogComponent', () => {
  let component: CustomerReceiptDialogComponent;
  let fixture: ComponentFixture<CustomerReceiptDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerReceiptDialogComponent]
    });
    fixture = TestBed.createComponent(CustomerReceiptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
