import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionDialogComponent } from './region-dialog.component';

describe('RegionDialogComponent', () => {
  let component: RegionDialogComponent;
  let fixture: ComponentFixture<RegionDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegionDialogComponent]
    });
    fixture = TestBed.createComponent(RegionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
