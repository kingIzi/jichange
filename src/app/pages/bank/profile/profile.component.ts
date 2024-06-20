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
import { LoginResponse } from 'src/app/core/models/login-response';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BankUserDialogComponent } from 'src/app/components/dialogs/bank/setup/bank-user-dialog/bank-user-dialog.component';
import { LoginService } from 'src/app/core/services/login.service';
import { ChangePasswordForm } from 'src/app/core/models/auth/change-password-form';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';

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
  public startLoading: boolean = false;
  public generalFormGroup!: FormGroup;
  public changePasswordFormGroup!: FormGroup;
  public languageFormGroup!: FormGroup;
  public employeeDetail!: EmployeeDetail;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public userProfile!: LoginResponse;
  public filterFormData: { branches: Branch[] } = { branches: [] };
  @ViewChild('changePasswordSubmit')
  changePasswordSubmit!: SubmitMessageBoxComponent;
  @ViewChild('changeLanguageSubmit')
  changeLanguageSubmit!: SubmitMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
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
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createChangePasswordFormGroup() {
    this.changePasswordFormGroup = this.fb.group({
      type: this.fb.control(this.userProfile.check.toLocaleUpperCase(), []),
      pwd: this.fb.control('', [Validators.required]),
      confirmPwd: this.fb.control('', [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, []),
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
      role: this.fb.control(this.userProfile.role, []),
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
            (b) => b.Sno === Number(this.userProfile.braid)
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
  private requestEmployeeDetail(body: { sno: string | number }) {
    this.startLoading = true;
    this.bankUserService
      .postFetchEmployeeDetail(body)
      .then((result) => {
        if (
          result.message.toLocaleLowerCase() === 'success'.toLocaleLowerCase()
        ) {
          this.employeeDetail = result.response;
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
  private requestChangePassword(form: ChangePasswordForm) {
    this.startLoading = true;
    this.loginService
      .changePassword(form)
      .then((result) => {
        if (
          result.message.toLocaleLowerCase() == 'Success'.toLocaleLowerCase()
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.success`),
            this.tr.translate(`auth.profile.passowordChangedSuccessfully`)
          );
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`auth.profile.failedToUpdatePassword`)
          );
        }
        this.changePasswordFormGroup.reset();
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
    this.parseUserProfile();
    this.createGeneralFormGroup();
    this.createChangePasswordFormGroup();
    this.createLanguageFormGroup();
    this.requestEmployeeDetail({ sno: this.userProfile.Usno });
    this.requestBranchList();
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
