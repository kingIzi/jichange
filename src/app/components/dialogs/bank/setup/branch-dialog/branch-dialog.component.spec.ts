import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchDialogComponent } from './branch-dialog.component';

describe('BranchDialogComponent', () => {
  let component: BranchDialogComponent;
  let fixture: ComponentFixture<BranchDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BranchDialogComponent]
    });
    fixture = TestBed.createComponent(BranchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
