import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceGeneratedComponent } from './invoice-generated.component';

describe('InvoiceGeneratedComponent', () => {
  let component: InvoiceGeneratedComponent;
  let fixture: ComponentFixture<InvoiceGeneratedComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InvoiceGeneratedComponent]
    });
    fixture = TestBed.createComponent(InvoiceGeneratedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
