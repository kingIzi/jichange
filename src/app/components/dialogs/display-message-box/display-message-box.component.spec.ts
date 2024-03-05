import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayMessageBoxComponent } from './display-message-box.component';

describe('DisplayMessageBoxComponent', () => {
  let component: DisplayMessageBoxComponent;
  let fixture: ComponentFixture<DisplayMessageBoxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayMessageBoxComponent]
    });
    fixture = TestBed.createComponent(DisplayMessageBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
