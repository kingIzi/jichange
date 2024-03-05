import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDetailsDialogComponent } from './invoice-details-dialog.component';

describe('InvoiceDetailsDialogComponent', () => {
  let component: InvoiceDetailsDialogComponent;
  let fixture: ComponentFixture<InvoiceDetailsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InvoiceDetailsDialogComponent]
    });
    fixture = TestBed.createComponent(InvoiceDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
