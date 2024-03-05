import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistrictDialogComponent } from './district-dialog.component';

describe('DistrictDialogComponent', () => {
  let component: DistrictDialogComponent;
  let fixture: ComponentFixture<DistrictDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DistrictDialogComponent]
    });
    fixture = TestBed.createComponent(DistrictDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
