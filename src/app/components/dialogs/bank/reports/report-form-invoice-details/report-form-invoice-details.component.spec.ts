import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportFormInvoiceDetailsComponent } from './report-form-invoice-details.component';

describe('ReportFormInvoiceDetailsComponent', () => {
  let component: ReportFormInvoiceDetailsComponent;
  let fixture: ComponentFixture<ReportFormInvoiceDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportFormInvoiceDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportFormInvoiceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
