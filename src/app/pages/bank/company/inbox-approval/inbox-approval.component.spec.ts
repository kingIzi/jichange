import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxApprovalComponent } from './inbox-approval.component';

describe('InboxApprovalComponent', () => {
  let component: InboxApprovalComponent;
  let fixture: ComponentFixture<InboxApprovalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InboxApprovalComponent]
    });
    fixture = TestBed.createComponent(InboxApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
