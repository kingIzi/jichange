import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-phone-number-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslocoModule,
  ],
  templateUrl: './phone-number-input.component.html',
  styleUrl: './phone-number-input.component.scss',
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneNumberInputComponent implements OnInit {
  public prefixes: string[] = ['255'];
  public mobileView: FormControl = new FormControl('', []);
  @Input() mobileNumber!: FormControl;
  //@Input() mobileNumber: FormControl = new FormControl('', []);
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  constructor(private cdr: ChangeDetectorRef) {}
  private formatPhoneNumber(cleaned: string) {
    let DIGITS = 3;

    let parts: string[] = [];
    if (!cleaned) return parts;

    if (cleaned.length > DIGITS ** 2) {
      cleaned = cleaned.substring(0, DIGITS ** 2);
    }

    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    if (cleaned.length > 0) {
      parts.push(cleaned.slice(0, DIGITS));
    }
    if (cleaned.length > DIGITS) {
      parts.push(cleaned.slice(DIGITS, DIGITS * 2));
    }
    if (cleaned.length > DIGITS * 2) {
      parts.push(cleaned.slice(DIGITS * 2, DIGITS ** 2));
    }
    return parts;
  }
  private formatPhoneNumberCountryCodeIncluded(cleaned: string) {
    let DIGITS = 3;
    let results: string[] = [];
    if (!cleaned) return results;
    for (let i = 0; i < cleaned.length; i += DIGITS) {
      results.push(cleaned.slice(i, i + DIGITS));
    }
    if (cleaned.length > DIGITS * 2) {
      results.shift();
    }
    return results;
  }
  private buildPage() {
    if (this.mobileNumber && this.mobileNumber.value === '') {
      this.mobileView.setValidators(this.mobileNumber.validator);
      this.mobileView.addValidators(
        Validators.pattern(/^\d{3} - \d{3} - \d{3}$/)
      );
    } else if (this.mobileNumber && this.mobileNumber.value !== '') {
      let parts = this.formatPhoneNumberCountryCodeIncluded(
        this.mobileNumber.value
      );
      this.mobileView.setValue(parts.join(' - '));
      if (this.mobileNumber.disabled) {
        this.mobileView.disable();
      }
    }
  }
  ngOnInit(): void {
    setTimeout(() => {
      this.buildPage();
      this.mobileNumber.statusChanges.subscribe(() => {
        this.mobileView.updateValueAndValidity();
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    }, 200);
  }
  formatToMobileNumber(inputFeild: any) {
    let prefix = ' - ';
    let text = inputFeild.target.value;
    let cleaned = text.replace(/\D/g, '');
    let parts = this.formatPhoneNumber(cleaned);
    let formatted = parts.join(prefix);
    this.mobileView.setValue(formatted);
    if (this.mobileView.valid) {
      parts.unshift(this.prefixes[0]);
      this.mobileNumber.setValue(parts.join(''));
    }
  }
}
