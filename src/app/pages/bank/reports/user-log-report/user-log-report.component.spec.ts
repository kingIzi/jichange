import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLogReportComponent } from './user-log-report.component';

describe('UserLogReportComponent', () => {
  let component: UserLogReportComponent;
  let fixture: ComponentFixture<UserLogReportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserLogReportComponent]
    });
    fixture = TestBed.createComponent(UserLogReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
