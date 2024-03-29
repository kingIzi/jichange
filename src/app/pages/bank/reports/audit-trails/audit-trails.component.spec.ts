import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditTrailsComponent } from './audit-trails.component';

describe('AuditTrailsComponent', () => {
  let component: AuditTrailsComponent;
  let fixture: ComponentFixture<AuditTrailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuditTrailsComponent]
    });
    fixture = TestBed.createComponent(AuditTrailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
