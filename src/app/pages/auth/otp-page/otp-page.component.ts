import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { divToggle } from '../auth-animations';
import { ForgotPasswordResponse } from 'src/app/core/models/auth/forgot-password-response';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { LoginService } from 'src/app/core/services/login.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
  templateUrl: './otp-page.component.html',
  styleUrl: './otp-page.component.scss',
  animations: [divToggle],
})
export class OtpPageComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  private counterValue: number = 0;
  private intervalId: number | undefined;
  private duration: number = 2 * 60 * 1000;
  public resendCodeCounter: number = 300; //2 minutes
  private phoneNumber: string = '';
  private otpData!: ForgotPasswordResponse;
  @ViewChild('noSessionFound') noSessionFound!: DisplayMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private tr: TranslocoService,
    private loginService: LoginService
  ) {}
  private parseOtpData() {
    let userProfile = sessionStorage.getItem('otp');
    if (userProfile) {
      this.otpData = JSON.parse(userProfile) as ForgotPasswordResponse;
    } else {
      let sessionNotFound = AppUtilities.openDisplayMessageBox(
        this.noSessionFound,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`auth.otp.noSessionFound`)
      );
      sessionNotFound.addEventListener('close', () => {
        this.router.navigate(['/auth']);
      });
    }
  }
  private createFormGroup() {
    this.formGroup = this.fb.group({
      mobile: this.fb.control(this.otpData.mobile_no, [Validators.required]),
      otp_code: this.fb.control('', [Validators.required]),
    });
  }
  private startCounter(): void {
    this.intervalId = window.setInterval(() => {
      this.resendCodeCounter--;
      if (this.resendCodeCounter == 0) {
        this.stopCounter();
      }
      this.cdr.detectChanges();
    }, 1000);
  }
  private requestSendOtpData(form: {
    mobile: string;
    otp_code: number | string;
  }) {
    this.startLoading = true;
    this.loginService
      .sendOtpResetPasswordLink(form)
      .then((result) => {
        if (
          typeof result.response === 'string' &&
          result.response.toLocaleLowerCase() === 'Valid'.toLocaleLowerCase()
        ) {
          sessionStorage.removeItem('otp');
          sessionStorage.setItem('otpMobileNumber', this.mobile.value);
          this.router.navigate([`/auth/password`]);
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`auth.otp.invalidCode`)
          );
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private stopCounter(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
    this.cdr.detectChanges();
  }
  private requestSendPasswordReset(form: { mobile: string }) {
    this.startLoading = true;
    this.loginService
      .forgotPasswordLink(form)
      .then((result) => {
        if (
          typeof result.response !== 'string' &&
          typeof result.response !== 'number'
        ) {
          sessionStorage.setItem('otp', JSON.stringify(result.response));
          this.resendCodeCounter = 300;
          this.startCounter();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`errors.errorOccured`),
            this.tr.translate(`auth.forgotPassword.resetPasswordFailed`)
          );
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseOtpData();
    this.createFormGroup();
    this.startCounter();
  }
  resendCode() {
    this.requestSendPasswordReset({ mobile: this.mobile.value });
  }
  submitForm() {
    if (this.formGroup.valid) {
      this.requestSendOtpData(this.formGroup.value);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get mobile() {
    return this.formGroup.get('mobile') as FormControl;
  }
  get otp_code() {
    return this.formGroup.get('otp_code') as FormControl;
  }
}
