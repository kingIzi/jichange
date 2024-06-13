import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDetailReportComponent } from './vendor-detail-report.component';

describe('VendorDetailReportComponent', () => {
  let component: VendorDetailReportComponent;
  let fixture: ComponentFixture<VendorDetailReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendorDetailReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VendorDetailReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
