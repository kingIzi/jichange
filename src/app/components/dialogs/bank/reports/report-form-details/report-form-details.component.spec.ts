import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportFormDetailsComponent } from './report-form-details.component';

describe('ReportFormDetailsComponent', () => {
  let component: ReportFormDetailsComponent;
  let fixture: ComponentFixture<ReportFormDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportFormDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportFormDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
