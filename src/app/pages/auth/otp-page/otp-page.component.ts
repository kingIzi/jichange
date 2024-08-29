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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslocoModule,
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
  private intervalId: number | undefined;
  private RESEND_CODE_TIMER = 300;
  public resendCodeCounter: number = this.RESEND_CODE_TIMER; //2 minutes
  private otpData!: ForgotPasswordResponse;
  public formControl: FormControl = new FormControl('', [
    Validators.pattern(/^\d{1} - \d{1} - \d{1} - \d{1} - \d{1} - \d{1}$/),
  ]);
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
  private parseSendOtpDataResponse(result: HttpDataResponse<string | number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`auth.otp.invalidCode`)
      );
    } else {
      sessionStorage.removeItem('otp');
      sessionStorage.setItem('otpMobileNumber', this.mobile.value);
      this.router.navigate([`/auth/password`]);
    }
  }
  private requestSendOtpData(form: {
    mobile: string;
    otp_code: number | string;
  }) {
    this.startLoading = true;
    this.loginService
      .sendOtpResetPasswordLink(form)
      .then((result) => {
        this.parseSendOtpDataResponse(result);
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
          this.resendCodeCounter = this.RESEND_CODE_TIMER;
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
  private cleanedParts(cleaned: string) {
    if (cleaned.length > 6) {
      cleaned = cleaned.substring(0, 6);
    }
    let parts = [];
    for (let i = 0; i < cleaned.length; i++) {
      parts.push(cleaned[i]);
    }
    return parts;
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
  formatToMobileNumber(inputFeild: any) {
    let prefix = ' - ';
    let text = inputFeild.target.value;
    let cleaned = text.replace(/\D/g, '');
    let parts = this.cleanedParts(cleaned);
    let formatted = parts.join(prefix);
    this.formControl.setValue(formatted);
    if (this.formControl.valid) {
      this.otp_code.setValue(parts.join(''));
    }
  }
  get mobile() {
    return this.formGroup.get('mobile') as FormControl;
  }
  get otp_code() {
    return this.formGroup.get('otp_code') as FormControl;
  }
}
