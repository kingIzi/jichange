import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardOverviewCardComponent } from './dashboard-overview-card.component';

describe('DashboardOverviewCardComponent', () => {
  let component: DashboardOverviewCardComponent;
  let fixture: ComponentFixture<DashboardOverviewCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardOverviewCardComponent]
    });
    fixture = TestBed.createComponent(DashboardOverviewCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
