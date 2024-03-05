import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneratedInvoiceListComponent } from './generated-invoice-list.component';

describe('GeneratedInvoiceListComponent', () => {
  let component: GeneratedInvoiceListComponent;
  let fixture: ComponentFixture<GeneratedInvoiceListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GeneratedInvoiceListComponent]
    });
    fixture = TestBed.createComponent(GeneratedInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
