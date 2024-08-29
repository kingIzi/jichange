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
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { BankService } from 'src/app/core/services/bank/setup/bank/bank.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TimeoutError } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BankUserDialogComponent } from 'src/app/components/dialogs/bank/setup/bank-user-dialog/bank-user-dialog.component';
import { LoginService } from 'src/app/core/services/login.service';
import { ChangePasswordForm } from 'src/app/core/models/auth/change-password-form';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  public themes: { label: string; color: string }[] = [
    { label: 'light', color: '#0B6587' },
    { label: 'coffee', color: '#20161F' },
  ];
  public selectedThemeIndex: number = 0;
  public startLoading: boolean = false;
  public generalFormGroup!: FormGroup;
  public changePasswordFormGroup!: FormGroup;
  public languageFormGroup!: FormGroup;
  public employeeDetail!: EmployeeDetail;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public filterFormData: { branches: Branch[] } = { branches: [] };
  @ViewChild('changePasswordSubmit')
  changePasswordSubmit!: SubmitMessageBoxComponent;
  @ViewChild('changeLanguageSubmit')
  changeLanguageSubmit!: SubmitMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private bankUserService: BankService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private branchService: BranchService,
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
      lname: this.fb.control('', []),
      email: this.fb.control('', []),
      mobile: this.fb.control('', []),
      role: this.fb.control(this.getUserProfile().role, []),
      branch: this.fb.control('', []),
    });
  }
  private createLanguageFormGroup() {
    this.languageFormGroup = this.fb.group({
      lang: this.fb.control(this.tr.getActiveLang().toLocaleLowerCase(), [
        Validators.required,
      ]),
    });
  }
  private requestBranchList() {
    this.startLoading = true;
    this.branchService
      .postBranchList({})
      .then((result) => {
        if (
          typeof result.response !== 'string' &&
          typeof result.response !== 'number'
        ) {
          this.filterFormData.branches = result.response;
          let branch = this.filterFormData.branches.find(
            (b) => b.Sno === Number(this.getUserProfile().braid)
          );
          this.generalFormGroup.get('branch')?.setValue(branch?.Name ?? '-');
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
  private setGeneralFormGroupData() {
    this.generalFormGroup
      .get('fname')
      ?.setValue(this.employeeDetail.First_Name);
    this.generalFormGroup.get('lname')?.setValue(this.employeeDetail.Last_name);
    this.generalFormGroup
      .get('email')
      ?.setValue(this.employeeDetail.Email_Address);
    this.generalFormGroup
      .get('mobile')
      ?.setValue(this.employeeDetail.Mobile_No);
  }
  private switchEmployeeDetailErrorMessage(message: string) {
    // let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
    //   message,
    //   this.tr,
    //   this.generalFormGroup.get('fname')?.value
    // );
    // if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      default:
        return this.tr.translate('auth.profile.failedToFetchUser');
    }
  }
  private parseEmployeeDetailResponse(
    result: HttpDataResponse<number | EmployeeDetail>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchEmployeeDetailErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      this.employeeDetail = result.response as EmployeeDetail;
      this.setGeneralFormGroupData();
    }
  }
  private requestEmployeeDetail(body: { sno: string | number }) {
    this.startLoading = true;
    this.bankUserService
      .postFetchEmployeeDetail(body)
      .then((result) => {
        this.parseEmployeeDetailResponse(result);
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
      AppUtilities.showSuccessMessage(
        message,
        (e: MouseEvent) => {},
        this.tr.translate('actions.view')
      );
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
  private prepareCurrentTheme() {
    let theme = localStorage.getItem('theme') as string;
    if (!theme) {
      this.selectedThemeIndex = 0;
    }
    // let foundIndex = this.themes.findIndex((val) =>
    //   val.label.localeCompare(theme)
    // );
    // if (foundIndex != -1) {
    //   this.selectedThemeIndex = foundIndex;
    // }
  }
  ngOnInit(): void {
    this.createGeneralFormGroup();
    this.createChangePasswordFormGroup();
    this.createLanguageFormGroup();
    //this.prepareCurrentTheme();
    this.requestEmployeeDetail({ sno: this.getUserProfile().Usno });
    this.requestBranchList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
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
    let dialogRef = this.dialog.open(BankUserDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        Detail_Id: this.employeeDetail.Detail_Id,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      this.requestEmployeeDetail({ sno: this.employeeDetail.Detail_Id });
      dialogRef.close();
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
  themeClicked(index: number) {
    let theme = this.themes.at(index);
    if (theme) {
      localStorage.setItem('theme', theme?.label);
      location.reload();
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
