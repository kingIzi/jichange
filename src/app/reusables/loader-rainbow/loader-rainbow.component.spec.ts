import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderRainbowComponent } from './loader-rainbow.component';

describe('LoaderRainbowComponent', () => {
  let component: LoaderRainbowComponent;
  let fixture: ComponentFixture<LoaderRainbowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LoaderRainbowComponent]
    });
    fixture = TestBed.createComponent(LoaderRainbowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
