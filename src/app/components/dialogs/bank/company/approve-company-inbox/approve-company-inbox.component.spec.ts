import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveCompanyInboxComponent } from './approve-company-inbox.component';

describe('ApproveCompanyInboxComponent', () => {
  let component: ApproveCompanyInboxComponent;
  let fixture: ComponentFixture<ApproveCompanyInboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApproveCompanyInboxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApproveCompanyInboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
