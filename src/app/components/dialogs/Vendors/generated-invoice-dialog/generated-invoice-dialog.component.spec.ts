import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedInvoiceDialogComponent } from './generated-invoice-dialog.component';

describe('GeneratedInvoiceDialogComponent', () => {
  let component: GeneratedInvoiceDialogComponent;
  let fixture: ComponentFixture<GeneratedInvoiceDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GeneratedInvoiceDialogComponent]
    });
    fixture = TestBed.createComponent(GeneratedInvoiceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
