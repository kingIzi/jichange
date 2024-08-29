import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  TranslocoService,
  TRANSLOCO_SCOPE,
  TranslocoModule,
} from '@ngneat/transloco';
import { TimeoutError } from 'rxjs';
import { CompanyUsersDialogComponent } from 'src/app/components/dialogs/Vendors/company-users-dialog/company-users-dialog.component';
import { BankUserDialogComponent } from 'src/app/components/dialogs/bank/setup/bank-user-dialog/bank-user-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { ChangePasswordForm } from 'src/app/core/models/auth/change-password-form';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';
import { GetCompanyByIdForm } from 'src/app/core/models/vendors/forms/get-company-user-by-id-form';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankService } from 'src/app/core/services/bank/setup/bank/bank.service';
import { LoginService } from 'src/app/core/services/login.service';
import { CompanyUserService } from 'src/app/core/services/vendor/company-user.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

enum PROFILE_OPTIONS {
  GENERAL,
  SECURITY,
  LANGUAGE,
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    SubmitMessageBoxComponent,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'auth', alias: 'auth' },
    },
  ],
})
export class ProfileComponent implements OnInit {
  public languages: { imgUrl: string; code: string; name: string }[] = [
    {
      imgUrl: '/assets/img/tz.png',
      code: 'sw',
      name: 'Swahili',
    },
    {
      imgUrl: '/assets/img/gb.png',
      code: 'en',
      name: 'English',
    },
  ];
  public startLoading: boolean = false;
  public generalFormGroup!: FormGroup;
  public languageFormGroup!: FormGroup;
  public changePasswordFormGroup!: FormGroup;
  //public activeTabs: any[] = [];
  public companyUser!: CompanyUser;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public PROFILE_OPTIONS: typeof PROFILE_OPTIONS = PROFILE_OPTIONS;
  @ViewChild('changeLanguageSubmit')
  changeLanguageSubmit!: SubmitMessageBoxComponent;
  @ViewChild('changePasswordSubmit')
  changePasswordSubmit!: SubmitMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('messageBox') messageBox!: DisplayMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private companyUserService: CompanyUserService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private loginService: LoginService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private passwordsMatchValidator(formGroup: FormGroup): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      let password = formGroup.get('pwd');
      let confirmPassword = formGroup.get('confirmPwd');
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
  private createChangePasswordFormGroup() {
    this.changePasswordFormGroup = this.fb.group({
      type: this.fb.control(
        this.getUserProfile().check.toLocaleUpperCase(),
        []
      ),
      pwd: this.fb.control('', [Validators.required]),
      confirmPwd: this.fb.control('', [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, []),
    });
    this.pwd.addValidators(
      this.passwordsMatchValidator(this.changePasswordFormGroup)
    );
    this.confirmPwd.addValidators(
      this.passwordsMatchValidator(this.changePasswordFormGroup)
    );
  }
  private createGeneralFormGroup() {
    this.generalFormGroup = this.fb.group({
      fname: this.fb.control('', []),
      mobile: this.fb.control('', []),
      email: this.fb.control('', [Validators.email]),
      role: this.fb.control(this.getUserProfile().role, []),
      username: this.fb.control('', []),
    });
  }
  private createLanguageFormGroup() {
    this.languageFormGroup = this.fb.group({
      lang: this.fb.control(this.tr.getActiveLang().toLocaleLowerCase(), [
        Validators.required,
      ]),
    });
  }
  private setGeneralFormGroupData() {
    this.generalFormGroup.setValue({
      fname: this.companyUser.Fullname ?? '',
      mobile: this.companyUser.Mobile,
      email: this.companyUser.Email,
      role: this.getUserProfile().role,
      username: this.companyUser.Username,
    });
    this.generalFormGroup.disable();
  }
  private requestEmployeeDetail(body: GetCompanyByIdForm) {
    this.startLoading = true;
    this.companyUserService
      .getCompanyUserByid(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response !== 'number' &&
          typeof result.response !== 'boolean'
        ) {
          this.companyUser = result.response as CompanyUser;
          this.setGeneralFormGroupData();
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
  private switchChangePasswordErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Password does not match.'.toLocaleLowerCase():
        return this.tr.translate('auth.changePassword.passwordsDoNotMatch');
      default:
        return this.tr.translate(`auth.profile.failedToUpdatePassword`);
    }
  }
  private parseChangePasswordResponse(
    result: HttpDataResponse<string | number>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      let message = this.switchChangePasswordErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        message
      );
    } else {
      let message = this.tr.translate(
        `auth.profile.passowordChangedSuccessfully`
      );
      let sal = AppUtilities.sweetAlertSuccessMessage(message);
      this.changePasswordFormGroup.reset();
    }
  }
  private requestChangePassword(form: ChangePasswordForm) {
    this.startLoading = true;
    this.loginService
      .changePassword(form)
      .then((result) => {
        this.parseChangePasswordResponse(result);
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
    this.createGeneralFormGroup();
    this.createLanguageFormGroup();
    this.createChangePasswordFormGroup();
    this.requestEmployeeDetail({ Sno: this.getUserProfile().Usno });
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  saveLanguageClicked() {
    if (
      this.tr.getActiveLang().toLocaleLowerCase() !==
      this.languageFormGroup.get('lang')?.value.toLocaleLowerCase()
    ) {
      let lang = this.languages.find(
        (l) =>
          l.code.toLocaleLowerCase() ===
          this.languageFormGroup.get('lang')?.value.toLocaleLowerCase()
      );
      if (lang) {
        let dialog = AppUtilities.openSubmitMessageBox(
          this.changeLanguageSubmit,
          this.tr.translate(`auth.profile.language.changeLanguage`),
          this.tr
            .translate(`auth.profile.language.sureLanguage`)
            .replace('{}', lang.name)
        );
        dialog.confirm.asObservable().subscribe(() => {
          this.tr.setActiveLang(lang.code);
          localStorage.setItem('activeLang', lang.code);
          location.reload();
        });
      }
    }
  }
  openEditBankUserForm() {
    let dialogRef = this.dialog.open(CompanyUsersDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        companyUserId: this.companyUser.CompuserSno,
      },
    });
    dialogRef.componentInstance.addedUser.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestEmployeeDetail({ Sno: this.getUserProfile().Usno });
    });
  }
  changePasswordClicked() {
    if (this.changePasswordFormGroup.valid) {
      let dialog = AppUtilities.openSubmitMessageBox(
        this.changePasswordSubmit,
        this.tr.translate(`auth.profile.security.changePassword`),
        this.tr.translate(`auth.profile.security.sureChangePassword`)
      );
      dialog.confirm.asObservable().subscribe(() => {
        this.requestChangePassword(this.changePasswordFormGroup.value);
      });
    } else {
      this.changePasswordFormGroup.markAllAsTouched();
    }
  }
  get type() {
    return this.changePasswordFormGroup.get(`type`) as FormControl;
  }
  get pwd() {
    return this.changePasswordFormGroup.get(`pwd`) as FormControl;
  }
  get confirmPwd() {
    return this.changePasswordFormGroup.get(`confirmPwd`) as FormControl;
  }
  get userid() {
    return this.changePasswordFormGroup.get(`userid`) as FormControl;
  }
}
