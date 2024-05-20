import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
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
import { MatDialogRef } from '@angular/material/dialog';
import { CountryDialogComponent } from '../../bank/setup/country-dialog/country-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CompanyUserService } from 'src/app/core/services/vendor/company-user.service';
import { RoleAct } from 'src/app/core/models/vendors/role-act';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

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
  public addedUser = new EventEmitter<any>();
  private userProfile!: LoginResponse;
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private tr: TranslocoService,
    private companyUser: CompanyUserService,
    private cdr: ChangeDetectorRef
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
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
      pos: this.fb.control('', []),
      auname: this.fb.control('', [Validators.required]),
      uname: this.fb.control('', [Validators.required]),
      mob: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      mail: this.fb.control('', [Validators.required, Validators.email]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      sno: this.fb.control('0', [Validators.required]),
      compid: this.fb.control(this.userProfile.InstID.toString(), [
        Validators.required,
      ]),
    });
  }
  private requestRolesAct() {
    this.startLoading = true;
    this.companyUser
      .requestRolesAct({ compid: this.userProfile.InstID })
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
  private requestAddRole(form: any) {
    this.startLoading = true;
    this.companyUser
      .requestAddRolesAct(form)
      .then((results: any) => {
        if (typeof results.response === 'number' && results.response > 0) {
          let dialog = AppUtilities.openSuccessMessageBox(
            this.successMessageBox,
            this.tr.translate(`company.companyUsersForm.successMessage`)
          );
          this.addedUser.emit();
        } else if (typeof results.response === 'string') {
          let dialog = AppUtilities.openSuccessMessageBox(
            this.successMessageBox,
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
    this.parseUserProfile();
    this.createForm();
    this.requestRolesAct();
  }
  ngAfterViewInit(): void {
    this.successMessageBox.closeSuccessMessageBox
      .asObservable()
      .subscribe(() => {
        this.dialogRef.close();
      });
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  submitCompanyUsersForm() {
    if (this.companyUsersForm.invalid) {
      this.companyUsersForm.markAllAsTouched();
      //this.formErrors();
      return;
    } else {
      this.requestAddRole(this.companyUsersForm.value);
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
}
