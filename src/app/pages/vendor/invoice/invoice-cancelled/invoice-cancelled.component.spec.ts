import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceCancelledComponent } from './invoice-cancelled.component';

describe('InvoiceCancelledComponent', () => {
  let component: InvoiceCancelledComponent;
  let fixture: ComponentFixture<InvoiceCancelledComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceCancelledComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InvoiceCancelledComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
