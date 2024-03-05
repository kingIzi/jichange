import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardListComponent } from './ward-list.component';

describe('WardListComponent', () => {
  let component: WardListComponent;
  let fixture: ComponentFixture<WardListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WardListComponent]
    });
    fixture = TestBed.createComponent(WardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
