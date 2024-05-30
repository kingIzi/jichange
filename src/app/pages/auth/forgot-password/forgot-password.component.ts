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
      name: this.fb.control('', [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
    });
  }

  private sendPasswordReset(form: { name: string }) {
    this.startLoading = true;
    this.loginService
      .sendResetPasswordLink(form)
      .then((result) => {
        if (
          typeof result.response === 'string' &&
          result.response.toLocaleLowerCase() === form.name.toLocaleLowerCase()
        ) {
          AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`auth.forgotPassword.resetPasswordSuccessfull`)
          );
          this.router.navigate(['/auth/otp']);
        } else {
          this.sendPasswordFailed();
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private sendPasswordSuccessfull() {
    return AppUtilities.openSuccessMessageBox(
      this.successMessageBox,
      this.tr.translate(`auth.forgotPassword.resetPasswordSuccessfull`)
    );
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
    if (this.name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingEmail`)
      );
    }
  }

  submitForm() {
    if (this.formGroup.valid) {
      this.router.navigate(['/auth/otp']);
      //this.sendPasswordReset(this.formGroup.value);
    } else {
      this.formGroup.markAllAsTouched();
      //this.formErrors();
    }
  }

  get name() {
    return this.formGroup.get('name') as FormControl;
  }
}
