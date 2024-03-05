import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankUserDialogComponent } from './bank-user-dialog.component';

describe('BankUserDialogComponent', () => {
  let component: BankUserDialogComponent;
  let fixture: ComponentFixture<BankUserDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BankUserDialogComponent]
    });
    fixture = TestBed.createComponent(BankUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
