import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CancelGeneratedInvoiceComponent } from './cancel-generated-invoice.component';

describe('CancelGeneratedInvoiceComponent', () => {
  let component: CancelGeneratedInvoiceComponent;
  let fixture: ComponentFixture<CancelGeneratedInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelGeneratedInvoiceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CancelGeneratedInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
