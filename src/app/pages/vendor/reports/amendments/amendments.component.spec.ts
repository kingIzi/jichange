import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmendmentsComponent } from './amendments.component';

describe('AmendmentsComponent', () => {
  let component: AmendmentsComponent;
  let fixture: ComponentFixture<AmendmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmendmentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AmendmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
