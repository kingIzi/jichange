import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionDetailsEditComponent } from './transaction-details-edit.component';

describe('TransactionDetailsEditComponent', () => {
  let component: TransactionDetailsEditComponent;
  let fixture: ComponentFixture<TransactionDetailsEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionDetailsEditComponent]
    });
    fixture = TestBed.createComponent(TransactionDetailsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
