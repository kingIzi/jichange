import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePickerDialogComponent } from './date-picker-dialog.component';

describe('DatePickerDialogComponent', () => {
  let component: DatePickerDialogComponent;
  let fixture: ComponentFixture<DatePickerDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DatePickerDialogComponent]
    });
    fixture = TestBed.createComponent(DatePickerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
