import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatedInvoiceListComponent } from './created-invoice-list.component';

describe('CreatedInvoiceListComponent', () => {
  let component: CreatedInvoiceListComponent;
  let fixture: ComponentFixture<CreatedInvoiceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatedInvoiceListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreatedInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
