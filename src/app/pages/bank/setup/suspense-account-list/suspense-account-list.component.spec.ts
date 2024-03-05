import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuspenseAccountListComponent } from './suspense-account-list.component';

describe('SuspenseAccountListComponent', () => {
  let component: SuspenseAccountListComponent;
  let fixture: ComponentFixture<SuspenseAccountListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SuspenseAccountListComponent]
    });
    fixture = TestBed.createComponent(SuspenseAccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
