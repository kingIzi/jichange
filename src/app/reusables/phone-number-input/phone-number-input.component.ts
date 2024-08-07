import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-phone-number-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './phone-number-input.component.html',
  styleUrl: './phone-number-input.component.scss',
})
export class PhoneNumberInputComponent {
  public prefixes: string[] = ['255'];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @Input() mobileNumber!: FormControl;
  @Input() inputSize: string = 'sm';
  setControl(value: string, prefix: string) {
    if (!value.startsWith(prefix) && value.length === 9) {
      this.mobileNumber.setValue(prefix + value);
    } else if (value.startsWith('+') && value.length === 13) {
      this.mobileNumber.setValue(value.substring(1));
    } else if (value.startsWith('0') && value.length === 10) {
      this.mobileNumber.setValue(prefix + value.substring(1));
    }
  }
}
