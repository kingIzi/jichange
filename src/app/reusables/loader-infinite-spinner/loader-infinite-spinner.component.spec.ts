import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderInfiniteSpinnerComponent } from './loader-infinite-spinner.component';

describe('LoaderInfiniteSpinnerComponent', () => {
  let component: LoaderInfiniteSpinnerComponent;
  let fixture: ComponentFixture<LoaderInfiniteSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoaderInfiniteSpinnerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoaderInfiniteSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
