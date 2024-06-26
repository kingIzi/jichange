import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyUsersComponent } from './company-users.component';

describe('CompanyUsersComponent', () => {
  let component: CompanyUsersComponent;
  let fixture: ComponentFixture<CompanyUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyUsersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompanyUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
