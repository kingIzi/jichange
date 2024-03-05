import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendorDashboardOverviewCardComponent } from './vendor-dashboard-overview-card.component';

describe('VendorDashboardOverviewCardComponent', () => {
  let component: VendorDashboardOverviewCardComponent;
  let fixture: ComponentFixture<VendorDashboardOverviewCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VendorDashboardOverviewCardComponent]
    });
    fixture = TestBed.createComponent(VendorDashboardOverviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
