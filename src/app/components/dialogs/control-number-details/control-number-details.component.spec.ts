import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlNumberDetailsComponent } from './control-number-details.component';

describe('ControlNumberDetailsComponent', () => {
  let component: ControlNumberDetailsComponent;
  let fixture: ComponentFixture<ControlNumberDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ControlNumberDetailsComponent]
    });
    fixture = TestBed.createComponent(ControlNumberDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
