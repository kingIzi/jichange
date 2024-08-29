import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoginService } from 'src/app/core/services/login.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    PhoneNumberInputComponent,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'auth' }],
})
export class ChangePasswordComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  private mobileNumber: string = '';
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginService: LoginService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef
  ) {}
  private passwordsMatchValidator(formGroup: FormGroup): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      let password = formGroup.get('password');
      let confirmPassword = formGroup.get('changePassword');
      if (
        password?.value &&
        confirmPassword?.value &&
        password.value !== confirmPassword.value
      ) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }
  private createFormGroup() {
    this.formGroup = this.fb.group({
      mobile: this.fb.control(this.mobileNumber, [Validators.required]),
      password: this.fb.control('', [Validators.required]),
      changePassword: this.fb.control('', [Validators.required]),
    });
    this.password.addValidators(this.passwordsMatchValidator(this.formGroup));
    this.changePassword.addValidators(
      this.passwordsMatchValidator(this.formGroup)
    );
    this.mobile.disable();
  }
  private parseMobileNumber() {
    this.mobileNumber = sessionStorage.getItem('otpMobileNumber') as string;
  }
  private changePasswordResponse(result: HttpDataResponse<string | number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`auth.changePassword.failedToUpdatePassword`)
      );
    } else {
      this.router.navigate(['/auth']);
    }
  }
  private requestChangePassword(body: { mobile: string; password: string }) {
    this.startLoading = true;
    this.loginService
      .forgotPasswordChangePasswordLink(body)
      .then((result) => {
        // if (
        //   typeof result.response === 'string' &&
        //   typeof result.message === 'string' &&
        //   result.message.toLocaleLowerCase() === 'Success'.toLocaleLowerCase()
        // ) {
        //   this.router.navigate(['/auth']);
        // } else {
        //   AppUtilities.openDisplayMessageBox(
        //     this.displayMessageBox,
        //     this.tr.translate(`defaults.failed`),
        //     this.tr.translate(`auth.changePassword.failedToUpdatePassword`)
        //   );
        // }
        this.changePasswordResponse(result);
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
    this.parseMobileNumber();
    this.createFormGroup();
  }
  submitForm() {
    if (this.formGroup.valid) {
      let form: { mobile: string; password: string } = {
        mobile: this.mobileNumber,
        password: this.password.value,
      };
      this.requestChangePassword(form);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get mobile() {
    return this.formGroup.get('mobile') as FormControl;
  }
  get password() {
    return this.formGroup.get('password') as FormControl;
  }
  get changePassword() {
    return this.formGroup.get('changePassword') as FormControl;
  }
}
