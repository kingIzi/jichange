import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmendmentsComponent } from './admendments.component';

describe('AdmendmentsComponent', () => {
  let component: AdmendmentsComponent;
  let fixture: ComponentFixture<AdmendmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmendmentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdmendmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
