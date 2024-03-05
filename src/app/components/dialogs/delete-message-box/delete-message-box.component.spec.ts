import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteMessageBoxComponent } from './delete-message-box.component';

describe('DeleteMessageBoxComponent', () => {
  let component: DeleteMessageBoxComponent;
  let fixture: ComponentFixture<DeleteMessageBoxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteMessageBoxComponent]
    });
    fixture = TestBed.createComponent(DeleteMessageBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
