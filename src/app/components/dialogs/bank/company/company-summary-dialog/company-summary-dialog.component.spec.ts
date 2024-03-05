import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanySummaryDialogComponent } from './company-summary-dialog.component';

describe('CompanySummaryDialogComponent', () => {
  let component: CompanySummaryDialogComponent;
  let fixture: ComponentFixture<CompanySummaryDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanySummaryDialogComponent]
    });
    fixture = TestBed.createComponent(CompanySummaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
