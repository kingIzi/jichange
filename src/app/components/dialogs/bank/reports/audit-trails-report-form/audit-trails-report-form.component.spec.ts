import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditTrailsReportFormComponent } from './audit-trails-report-form.component';

describe('AuditTrailsReportFormComponent', () => {
  let component: AuditTrailsReportFormComponent;
  let fixture: ComponentFixture<AuditTrailsReportFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditTrailsReportFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuditTrailsReportFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
