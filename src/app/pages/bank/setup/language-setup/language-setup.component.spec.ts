import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSetupComponent } from './language-setup.component';

describe('LanguageSetupComponent', () => {
  let component: LanguageSetupComponent;
  let fixture: ComponentFixture<LanguageSetupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LanguageSetupComponent]
    });
    fixture = TestBed.createComponent(LanguageSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
