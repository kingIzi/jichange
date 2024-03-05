import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTextListComponent } from './email-text-list.component';

describe('EmailTextListComponent', () => {
  let component: EmailTextListComponent;
  let fixture: ComponentFixture<EmailTextListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmailTextListComponent]
    });
    fixture = TestBed.createComponent(EmailTextListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
