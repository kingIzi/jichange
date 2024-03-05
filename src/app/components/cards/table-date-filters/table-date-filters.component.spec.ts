import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableDateFiltersComponent } from './table-date-filters.component';

describe('TableDateFiltersComponent', () => {
  let component: TableDateFiltersComponent;
  let fixture: ComponentFixture<TableDateFiltersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TableDateFiltersComponent]
    });
    fixture = TestBed.createComponent(TableDateFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
