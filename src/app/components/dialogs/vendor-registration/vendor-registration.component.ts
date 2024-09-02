import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
  ],
})
export class VendorRegistrationComponent implements OnInit {
  public startLoading: boolean = false;
  public branchDetails: BranchDetail[] = [];
  public vendorFormGroup!: FormGroup;
  public addedVendor = new EventEmitter<void>();
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddVendor', { static: true })
  confirmAddVendor!: ElementRef<HTMLDialogElement>;
  constructor(
    private dialogRef: MatDialogRef<VendorRegistrationComponent>,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private companyService: CompanyService,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef
  ) {}
  private assignBranchList(
    result: HttpDataResponse<string | number | Branch[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number'
    ) {
      this.branchDetails = result.response;
    } else {
      this.branchDetails = [];
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`auth.vendorRegistration.failedToRetrieveBranchList`)
      );
    }
  }
  private async fetchBranchList() {
    this.startLoading = true;
    this.branchService
      .postBranchList({})
      .then((result) => {
        this.assignBranchList(result);
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
  private switchAddCompanyLErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.compname.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing email'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.missingEmail'
        );
      case 'Email exists'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.emailExists'
        );
      case 'Missing Company Name'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.missingVendorName'
        );
      case 'Missing Mobile number'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.missingPhoneNo'
        );
      case 'Missing Account Number'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.missingAccountNo'
        );
      case 'Missing Branch'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.missingBranchName'
        );
      case 'Missing Checker Status'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.makerChecker'
        );
      case 'Company name exists'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.vendorNameExists'
        );
      case 'Tin number exists'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.tinNumberExists'
        );
      case 'Mobile number exists'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.mobileExists'
        );
      default:
        return this.tr.translate('auth.vendorRegistration.failedToAddVendor');
    }
  }
  private assignAddCompanyLResponse(
    result: HttpDataResponse<string | number | boolean>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let message = this.switchAddCompanyLErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        message
      );
    } else {
      let message = this.tr.translate(
        `auth.vendorRegistration.form.success.vendorAddedSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        message,
        () => {},
        this.tr.translate('actions.ok')
      );
      this.addedVendor.emit();
    }
  }
  private requestAddCompanyL(form: AddCompanyL) {
    this.startLoading = true;
    this.companyService
      .addCompanyL(form)
      .then((result) => {
        this.assignAddCompanyLResponse(result);
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
  private switchCheckAccountErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.accno.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing Account Number'.toLocaleLowerCase():
        return this.tr.translate(
          'auth.vendorRegistration.form.errors.dialogs.missingAccountNo'
        );
      default:
        return this.tr.translate('errors.serverError');
    }
  }

  private parseCheckAccountResponse(result: HttpDataResponse<boolean>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchCheckAccountErrorMessage(result.message[0]);
      this.startLoading = false;
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    }
    let isInValid = result.response;
    if (isInValid) {
      this.startLoading = false;
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(
          `auth.vendorRegistration.form.errors.dialogs.invalidFormError`
        ),
        this.tr.translate(
          `auth.vendorRegistration.form.errors.dialogs.invalidAccounntNo`
        )
      );
    } else {
      this.requestAddCompanyL(this.vendorFormGroup.value as AddCompanyL);
    }
  }

  ngOnInit(): void {
    this.createVendorForm();
    this.fetchBranchList();
  }

  submitVendor() {
    if (this.vendorFormGroup.valid) {
      this.confirmAddVendor.nativeElement.showModal();
    } else {
      this.vendorFormGroup.markAllAsTouched();
    }
  }

  addVendor() {
    this.startLoading = true;
    this.companyService
      .checkAccount({ acc: this.accno.value })
      .then((result) => {
        this.parseCheckAccountResponse(result);
        //this.startLoading = false;
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

  private createVendorForm() {
    this.vendorFormGroup = this.fb.group({
      compsno: this.fb.control('0', [Validators.required]),
      compname: this.fb.control('', [Validators.required]),
      userid: this.fb.control('0', []),
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
        //Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
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
