import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../success-message-box/success-message-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CountryDialogComponent } from '../../bank/setup/country-dialog/country-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { CompanyUserService } from 'src/app/core/services/vendor/company-user.service';
import { RoleAct } from 'src/app/core/models/vendors/role-act';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-company-users-dialog',
  templateUrl: './company-users-dialog.component.html',
  styleUrls: ['./company-users-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    PhoneNumberInputComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/company', alias: 'company' },
    },
  ],
})
export class CompanyUsersDialogComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public roleActs: RoleAct[] = [];
  public companyUsersForm!: FormGroup;
  public companyUser!: CompanyUser;
  public addedUser = new EventEmitter<any>();
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('addCompanyUserDialog', { static: true })
  addCompanyUserDialog!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private tr: TranslocoService,
    private companyUserService: CompanyUserService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      companyUserId: number | string;
    }
  ) {}
  private formErrors(
    errorsPath: string = 'company.companyUsersForm.errors.dialog'
  ) {
    if (this.pos.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.role`)
      );
    }
    if (this.mob.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.mobileNo`)
      );
    }
    if (this.mail.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.emailId`)
      );
    }
    if (this.uname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.fullName`)
      );
    }
    if (this.auname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.username`)
      );
    }
  }
  private createForm() {
    this.companyUsersForm = this.fb.group({
      pos: this.fb.control('', [Validators.required]),
      auname: this.fb.control('', [Validators.required]),
      uname: this.fb.control('', [Validators.required]),
      mob: this.fb.control('', [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      mail: this.fb.control('', [Validators.required, Validators.email]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      sno: this.fb.control('0', [Validators.required]),
      compid: this.fb.control(this.getUserProfile().InstID.toString(), [
        Validators.required,
      ]),
      chname: this.fb.control('', []),
    });
  }
  private modifyForm() {
    this.pos.setValue(this.companyUser.Userpos);
    this.auname.setValue(this.companyUser.Username),
      this.uname.setValue(this.companyUser.Fullname),
      this.mob.setValue(this.companyUser.Mobile),
      this.mail.setValue(this.companyUser.Email);
    this.sno.setValue(this.companyUser.CompuserSno);
    this.chname.setValue('00' + this.pos.value);
  }
  private buildPage() {
    this.startLoading = true;
    let companyUserObservable = from(
      this.companyUserService.getCompanyUserByid({
        Sno: this.data.companyUserId,
      })
    );
    let mergedObservable = zip(companyUserObservable);
    let res = lastValueFrom(
      mergedObservable.pipe(
        map((result) => {
          return result;
        }),
        catchError((err) => {
          throw err;
        })
      )
    );
    res
      .then((results) => {
        let [companyUser] = results;
        if (
          companyUser.response &&
          typeof companyUser.response !== 'string' &&
          typeof companyUser.response !== 'number' &&
          typeof companyUser.response !== 'boolean'
        ) {
          this.companyUser = companyUser.response;
          this.modifyForm();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`errors.errorOccured`),
            this.tr.translate(`company.failedToRetrieveCompanyUser`)
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
  private requestRolesAct() {
    this.startLoading = true;
    this.companyUserService
      .requestRolesAct({ compid: 67 }) //permanently at 67
      .then((results: any) => {
        this.roleActs = results.response === 0 ? [] : results.response;
        if (this.roleActs.length === 0) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.warning`),
            this.tr.translate(
              `company.companyUsersForm.errors.dialog.noRoleActFound`
            )
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
      });
  }
  private requestAddCompanyUser(form: any) {
    this.startLoading = true;
    this.companyUserService
      .requestAddCompanyUser(form)
      .then((results: any) => {
        if (typeof results.response === 'number' && results.response > 0) {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`company.companyUsersForm.successMessage`)
          );
          this.addedUser.emit();
        } else if (typeof results.response === 'string') {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr
              .translate(
                `company.companyUsersForm.errors.dialog.FailedToAddCompany`
              )
              .replace('{}', results.response)
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
      });
  }
  ngOnInit(): void {
    this.requestRolesAct();
    this.createForm();
    if (this.data.companyUserId) {
      this.buildPage();
    }
  }
  ngAfterViewInit(): void {
    this.successMessageBox.closeSuccessMessageBox
      .asObservable()
      .subscribe(() => {
        this.dialogRef.close();
      });
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  addCompanyUser() {
    this.requestAddCompanyUser(this.companyUsersForm.value);
  }
  submitCompanyUsersForm() {
    if (this.companyUsersForm.valid) {
      this.chname.setValue('00' + this.pos.value);
      this.addCompanyUserDialog.nativeElement.showModal();
    } else {
      this.companyUsersForm.markAllAsTouched();
    }
  }
  get pos() {
    return this.companyUsersForm.get('pos') as FormControl;
  }
  get auname() {
    return this.companyUsersForm.get('auname') as FormControl;
  }
  get uname() {
    return this.companyUsersForm.get('uname') as FormControl;
  }
  get mob() {
    return this.companyUsersForm.get('mob') as FormControl;
  }
  get mail() {
    return this.companyUsersForm.get('mail') as FormControl;
  }
  get sno() {
    return this.companyUsersForm.get('sno') as FormControl;
  }
  get chname() {
    return this.companyUsersForm.get('chname') as FormControl;
  }
}
