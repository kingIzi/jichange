import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmAddCustomerDialogComponent } from './confirm-add-customer-dialog.component';

describe('ConfirmAddCustomerDialogComponent', () => {
  let component: ConfirmAddCustomerDialogComponent;
  let fixture: ComponentFixture<ConfirmAddCustomerDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfirmAddCustomerDialogComponent]
    });
    fixture = TestBed.createComponent(ConfirmAddCustomerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
