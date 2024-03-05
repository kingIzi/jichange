import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspenseAccountDialogComponent } from './suspense-account-dialog.component';

describe('SuspenseAccountDialogComponent', () => {
  let component: SuspenseAccountDialogComponent;
  let fixture: ComponentFixture<SuspenseAccountDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SuspenseAccountDialogComponent]
    });
    fixture = TestBed.createComponent(SuspenseAccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
