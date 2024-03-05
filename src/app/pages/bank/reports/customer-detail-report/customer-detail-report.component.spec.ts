import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDetailReportComponent } from './customer-detail-report.component';

describe('CustomerDetailReportComponent', () => {
  let component: CustomerDetailReportComponent;
  let fixture: ComponentFixture<CustomerDetailReportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerDetailReportComponent]
    });
    fixture = TestBed.createComponent(CustomerDetailReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
