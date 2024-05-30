import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableFormHeadersComponent } from './table-form-headers.component';

describe('TableFormHeadersComponent', () => {
  let component: TableFormHeadersComponent;
  let fixture: ComponentFixture<TableFormHeadersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableFormHeadersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableFormHeadersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
