import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersDialogComponent } from './customers-dialog.component';

describe('CustomersDialogComponent', () => {
  let component: CustomersDialogComponent;
  let fixture: ComponentFixture<CustomersDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomersDialogComponent]
    });
    fixture = TestBed.createComponent(CustomersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
