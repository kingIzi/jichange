import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionalConfirmMessageBoxComponent } from './optional-confirm-message-box.component';

describe('OptionalConfirmMessageBoxComponent', () => {
  let component: OptionalConfirmMessageBoxComponent;
  let fixture: ComponentFixture<OptionalConfirmMessageBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionalConfirmMessageBoxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OptionalConfirmMessageBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
