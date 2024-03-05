import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrencyDialogComponent } from './currency-dialog.component';

describe('CurrencyDialogComponent', () => {
  let component: CurrencyDialogComponent;
  let fixture: ComponentFixture<CurrencyDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CurrencyDialogComponent]
    });
    fixture = TestBed.createComponent(CurrencyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
