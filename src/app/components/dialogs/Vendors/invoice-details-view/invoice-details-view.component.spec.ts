import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceDetailsViewComponent } from './invoice-details-view.component';

describe('InvoiceDetailsViewComponent', () => {
  let component: InvoiceDetailsViewComponent;
  let fixture: ComponentFixture<InvoiceDetailsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceDetailsViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InvoiceDetailsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
