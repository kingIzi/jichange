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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { divToggle } from '../auth-animations';

@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [CommonModule, TranslocoModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
  templateUrl: './otp-page.component.html',
  styleUrl: './otp-page.component.scss',
  animations: [divToggle],
})
export class OtpPageComponent implements OnInit {
  public formGroup!: FormGroup;
  private counterValue: number = 0;
  private intervalId: number | undefined;
  private duration: number = 2 * 60 * 1000;
  public resendCodeCounter: number = 5; //2 minutes
  private phoneNumber: string = '';
  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      otp: this.fb.control('', [Validators.required]),
    });
  }
  private startCounter(): void {
    this.intervalId = window.setInterval(() => {
      this.resendCodeCounter--;
      if (this.resendCodeCounter == 0) {
        this.stopCounter();
      }
      console.log(this.resendCodeCounter);
      this.cdr.detectChanges();
    }, 1000);
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
    this.activatedRoute.params.subscribe((params: any) => {
      this.phoneNumber = atob(params['phone']);
    });
  }
  resendCode() {
    this.resendCodeCounter = 5;
    this.startCounter();
  }
  submitForm() {
    if (this.formGroup.valid) {
      this.router.navigate([`/auth/password/${btoa(this.phoneNumber)}`]);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get otp() {
    return this.formGroup.get('otp') as FormControl;
  }
}
