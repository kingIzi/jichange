import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankUserListComponent } from './bank-user-list.component';

describe('BankUserListComponent', () => {
  let component: BankUserListComponent;
  let fixture: ComponentFixture<BankUserListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BankUserListComponent]
    });
    fixture = TestBed.createComponent(BankUserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
