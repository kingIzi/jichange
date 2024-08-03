import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelledInvoiceReportComponent } from './cancelled-invoice-report.component';

describe('CancelledInvoiceReportComponent', () => {
  let component: CancelledInvoiceReportComponent;
  let fixture: ComponentFixture<CancelledInvoiceReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelledInvoiceReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CancelledInvoiceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
