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
import { Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TimeoutError } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { LoginService } from 'src/app/core/services/login.service';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxLoadingModule,
    ReactiveFormsModule,
    TranslocoModule,
    CommonModule,
    RouterModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    PhoneNumberInputComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
})
export class ForgotPasswordComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private loginService: LoginService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  private createForm() {
    this.formGroup = this.fb.group({
      mobile: this.fb.control('', [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
    });
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
          this.router.navigate([`/auth/otp`]);
        } else {
          this.sendPasswordFailed();
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
  private sendPasswordFailed() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`errors.errorOccured`),
      this.tr.translate(`auth.forgotPassword.resetPasswordFailed`)
    );
  }
  private formErrors(
    errorsPath: string = 'auth.forgotPassword.form.errors.dialogs'
  ) {
    if (this.mobile.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingEmail`)
      );
    }
  }
  submitForm() {
    if (this.formGroup.valid) {
      this.requestSendPasswordReset(this.formGroup.value);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get mobile() {
    return this.formGroup.get('mobile') as FormControl;
  }
}
