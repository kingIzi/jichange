import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [CommonModule, TranslocoModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
  templateUrl: './otp-page.component.html',
  styleUrl: './otp-page.component.scss',
})
export class OtpPageComponent implements OnInit {
  public formGroup!: FormGroup;
  private counterValue: number = 0;
  private intervalId: number | undefined;
  private duration: number = 2 * 60 * 1000;
  public resendCodeCounter: number = 120; //2 minutes
  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      otp: this.fb.control('', [Validators.required]),
    });
  }
  private startCounter(): void {
    this.intervalId = window.setInterval(() => {
      this.resendCodeCounter--;
      console.log(this.resendCodeCounter);
      this.cdr.detectChanges();
    }, 1000);

    // Stop the counter after the duration
    setTimeout(() => {
      this.stopCounter();
    }, this.duration);
  }

  private stopCounter(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
    this.cdr.detectChanges();
  }
  ngOnInit(): void {
    this.createFormGroup();
    this.startCounter();
  }
  resendCode() {
    if (this.resendCodeCounter > 0) {
    } else {
      this.startCounter();
    }
  }
  submitForm() {
    if (this.formGroup.valid) {
      alert('reset user password');
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get otp() {
    return this.formGroup.get('otp') as FormControl;
  }
}
