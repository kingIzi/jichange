import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
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
import { MatDialogRef } from '@angular/material/dialog';
import { BranchDetail } from 'src/app/core/models/branch-detail';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { DisplayMessageBoxComponent } from '../display-message-box/display-message-box.component';
import { NgxLoadingModule } from 'ngx-loading';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { SuccessMessageBoxComponent } from '../success-message-box/success-message-box.component';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { AddCompany } from 'src/app/core/models/bank/forms/company/summary/add-company';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { AddCompanyL } from 'src/app/core/models/bank/forms/company/summary/add-company-l';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TimeoutError } from 'rxjs';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';

@Component({
  selector: 'app-vendor-registration',
  templateUrl: './vendor-registration.component.html',
  styleUrls: ['./vendor-registration.component.scss'],
  standalone: true,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: { scope: 'auth' } }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxLoadingModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    PhoneNumberInputComponent,
  ],
})
export class VendorRegistrationComponent implements OnInit {
  public startLoading: boolean = false;
  public branchDetails: BranchDetail[] = [];
  public vendorFormGroup!: FormGroup;
  public addedVendor = new EventEmitter<void>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private dialogRef: MatDialogRef<VendorRegistrationComponent>,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private companyService: CompanyService,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef
  ) {}
  private async fetchBranchList() {
    this.startLoading = true;
    this.branchService
      .postBranchList({})
      .then((results: any) => {
        this.startLoading = false;
        this.branchDetails = results.response;
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

  private formErrors(
    errorsPath: string = 'auth.vendorRegistration.form.errors.dialogs'
  ) {
    if (this.compname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingVendorName`)
      );
    } else if (this.mob.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingPhoneNo`)
      );
    } else if (this.branch.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingBranchName`)
      );
    } else if (this.accno.invalid && this.accno.hasError('required')) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.missingAccountNo`)
      );
    } else if (this.accno.invalid && this.accno.hasError('pattern')) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.invalidAccounntNo`)
      );
    } else if (this.check_status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.makerChecker`)
      );
    }
  }

  private requestAddCompanyL(form: AddCompanyL) {
    this.startLoading = true;
    this.companyService
      .addCompanyL(form)
      .then((results) => {
        if (
          typeof results.response === 'string' &&
          results.response.toLocaleLowerCase() ==
            'Mobile number already exist'.toLocaleLowerCase()
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(
              `auth.vendorRegistration.form.errors.dialogs.mobileNumberExists`
            )
          );
        } else if (
          typeof results.response === 'string' &&
          results.response.toLocaleLowerCase() == 'EXIST'.toLocaleLowerCase()
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(
              `auth.vendorRegistration.form.errors.dialogs.vendorExists`
            )
          );
        } else {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(
              `auth.vendorRegistration.form.success.vendorAddedSuccessfully`
            )
          );
          this.addedVendor.emit();
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
    this.createVendorForm();
    this.fetchBranchList();
  }

  async submitVendor() {
    if (!this.vendorFormGroup.valid) {
      this.vendorFormGroup.markAllAsTouched();
      this.formErrors();
      return;
    }
    let errorsPath = `auth.vendorRegistration.form.errors.dialogs`;
    let res = (await this.companyService.checkAccount(
      this.accno.value
    )) as HttpDataResponse<Boolean>;
    if (res.response == true) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidFormError`),
        this.tr.translate(`${errorsPath}.invalidAccounntNo`)
      );
    } else {
      this.requestAddCompanyL(this.vendorFormGroup.value as AddCompanyL);
    }
  }

  createVendorForm() {
    this.vendorFormGroup = this.fb.group({
      compsno: this.fb.control('0', [Validators.required]),
      compname: this.fb.control('', [Validators.required]),
      mob: this.fb.control('', [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      branch: this.fb.control('', [Validators.required]),
      check_status: this.fb.control('', [Validators.required]),
      fax: this.fb.control('', []),
      pbox: this.fb.control('', []),
      addr: this.fb.control('', []),
      rsno: this.fb.control('0', [Validators.required]),
      dsno: this.fb.control('0', [Validators.required]),
      wsno: this.fb.control('0', [Validators.required]),
      tin: this.fb.control('', []),
      vat: this.fb.control('', []),
      dname: this.fb.control('', []),
      telno: this.fb.control('', [
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      email: this.fb.control('', [Validators.email]),
      dummy: this.fb.control(true, [Validators.required]),
      accno: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^(01|02)(J|\d)\d{10}$/),
      ]),
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  submitSuccessfull() {
    let dialog = AppUtilities.openSuccessMessageBox(
      this.successMessageBox,
      this.tr.translate(
        `auth.vendorRegistration.form.errors.success.vendorAddedSuccessfully`
      )
    );
    if (dialog) {
      dialog.addEventListener('close', () => {
        this.closeDialog();
      });
    }
  }

  submitFailed() {
    AppUtilities.noInternetError(this.displayMessageBox, this.tr);
  }

  get compname() {
    return this.vendorFormGroup.get('compname') as FormControl;
  }
  get mob() {
    return this.vendorFormGroup.get('mob') as FormControl;
  }
  get branch() {
    return this.vendorFormGroup.get('branch') as FormControl;
  }
  get accno() {
    return this.vendorFormGroup.get('accno') as FormControl;
  }
  get check_status() {
    return this.vendorFormGroup.get('check_status') as FormControl;
  }
  get email() {
    return this.vendorFormGroup.get(`email`) as FormControl;
  }
}
