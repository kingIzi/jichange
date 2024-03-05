import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyUsersDialogComponent } from './company-users-dialog.component';

describe('CompanyUsersDialogComponent', () => {
  let component: CompanyUsersDialogComponent;
  let fixture: ComponentFixture<CompanyUsersDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompanyUsersDialogComponent]
    });
    fixture = TestBed.createComponent(CompanyUsersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
