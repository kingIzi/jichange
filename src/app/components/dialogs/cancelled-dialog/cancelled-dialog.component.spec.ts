import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelledDialogComponent } from './cancelled-dialog.component';

describe('CancelledDialogComponent', () => {
  let component: CancelledDialogComponent;
  let fixture: ComponentFixture<CancelledDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CancelledDialogComponent]
    });
    fixture = TestBed.createComponent(CancelledDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
