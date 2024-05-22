import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCompanyUserDialogComponent } from './edit-company-user-dialog.component';

describe('EditCompanyUserDialogComponent', () => {
  let component: EditCompanyUserDialogComponent;
  let fixture: ComponentFixture<EditCompanyUserDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCompanyUserDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditCompanyUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
