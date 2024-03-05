import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedInvoiceViewComponent } from './generated-invoice-view.component';

describe('GeneratedInvoiceViewComponent', () => {
  let component: GeneratedInvoiceViewComponent;
  let fixture: ComponentFixture<GeneratedInvoiceViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GeneratedInvoiceViewComponent]
    });
    fixture = TestBed.createComponent(GeneratedInvoiceViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
