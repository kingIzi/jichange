import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositAccountDialogComponent } from './deposit-account-dialog.component';

describe('DepositAccountDialogComponent', () => {
  let component: DepositAccountDialogComponent;
  let fixture: ComponentFixture<DepositAccountDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DepositAccountDialogComponent]
    });
    fixture = TestBed.createComponent(DepositAccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
