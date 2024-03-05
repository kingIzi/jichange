import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDetailsGraphComponent } from './invoice-details-graph.component';

describe('InvoiceDetailsGraphComponent', () => {
  let component: InvoiceDetailsGraphComponent;
  let fixture: ComponentFixture<InvoiceDetailsGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [InvoiceDetailsGraphComponent]
    });
    fixture = TestBed.createComponent(InvoiceDetailsGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
