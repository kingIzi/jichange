import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmendmentComponent } from './amendment.component';

describe('AmendmentComponent', () => {
  let component: AmendmentComponent;
  let fixture: ComponentFixture<AmendmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmendmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AmendmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
