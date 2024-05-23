import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmendmentDetailsDialogComponent } from './amendment-details-dialog.component';

describe('AmendmentDetailsDialogComponent', () => {
  let component: AmendmentDetailsDialogComponent;
  let fixture: ComponentFixture<AmendmentDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmendmentDetailsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AmendmentDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
