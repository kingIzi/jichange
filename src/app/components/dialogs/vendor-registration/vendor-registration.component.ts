import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
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
import { AddCompany } from 'src/app/core/models/bank/forms/add-company';
import { CompanyService } from 'src/app/core/services/bank/company/company.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BranchService } from 'src/app/core/services/setup/branch.service';
import { Branch } from 'src/app/core/models/bank/branch';
import { AddCompanyL } from 'src/app/core/models/bank/forms/add-company-l';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';

@Component({
  selector: 'app-vendor-registration',
  templateUrl: './vendor-registration.component.html',
  styleUrls: ['./vendor-registration.component.scss'],
  standalone: true,
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: { scope: 'auth' } }],
  imports: [
    NgxLoadingModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
  ],
})
export class VendorRegistrationComponent implements OnInit {
  public startLoading: boolean = false;
  public branchDetails: BranchDetail[] = [];
  public vendorFormGroup!: FormGroup;
  public loadingStart = new EventEmitter<void>();
  public loadingEnd = new EventEmitter<void>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private dialogRef: MatDialogRef<VendorRegistrationComponent>,
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private companyService: CompanyService,
    private branchService: BranchService
  ) {}
  ngOnInit(): void {
    this.createVendorForm();
    this.fetchBranchList();
  }

  private async fetchBranchList() {
    this.startLoading = true;
    this.branchService
      .postBranchList({})
      .then((results: any) => {
        this.startLoading = false;
        this.branchDetails = results.response;
      })
      .catch((err) => {
        this.startLoading = false;
        this.loadingEnd.emit();
        this.submitFailed();
        throw err;
      });
  }

  createVendorForm() {
    this.vendorFormGroup = this.fb.group({
      // compsno: this.fb.control('0', [Validators.required]),
      // compname: this.fb.control('', [Validators.required]),
      // mob: this.fb.control('', [
      //   Validators.required,
      //   Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      // ]),
      // rsno: this.fb.control('0', [Validators.required]),
      // dsno: this.fb.control('0', [Validators.required]),
      // wsno: this.fb.control('0', [Validators.required]),
      // branch: this.fb.control('0', [Validators.required]),
      // accno: this.fb.control('', [Validators.required]),
      // check_status: this.fb.control('', [Validators.required]),
      // dummy: this.fb.control(true, [Validators.required]),
      compsno: this.fb.control('0', [Validators.required]),
      compname: this.fb.control('', [Validators.required]),
      mob: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
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
        Validators.pattern(/^(255|\+255|0)[67]\d{8}$/),
      ]),
      email: this.fb.control('', [Validators.email]),
      dummy: this.fb.control(true, [Validators.required]),
      accno: this.fb.control('', [Validators.required]),
    });
  }

  updatePhoneNumberPrefix(prefix: string, control: FormControl) {
    AppUtilities.mobileNumberFormat(prefix, control);
  }

  private formErrors(
    errorsPath: string = 'auth.vendorRegistration.form.errors.dialogs'
  ) {
    if (this.compname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingVendorName`)
      );
    } else if (this.mob.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingPhoneNo`)
      );
    } else if (this.branch.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingBranchName`)
      );
    } else if (this.accno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingAccountNo`)
      );
    } else if (this.check_status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.makerChecker`)
      );
    }
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
    if (res.response == false) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.invalidAccounntNo`)
      );
    } else {
      let addCompanyL = this.vendorFormGroup.value as AddCompanyL;
      // let addCompanyL = new AddCompanyL();
      // addCompanyL.accno = this.vendorFormGroup.value.accno;
      // addCompanyL.rsno = this.vendorFormGroup.value.rsno;
      // addCompanyL.dsno = this.vendorFormGroup.value.dsno;
      // addCompanyL.wsno = this.vendorFormGroup.value.wsno;
      // addCompanyL.compname = this.vendorFormGroup.value.compname;
      // addCompanyL.compsno = this.vendorFormGroup.value.compsno;
      // addCompanyL.dummy = this.vendorFormGroup.value.dummy;
      // addCompanyL.branch = this.vendorFormGroup.value.branch;
      // addCompanyL.check_status = this.vendorFormGroup.value.check_status;
      // addCompanyL.mob = this.vendorFormGroup.value.mob;
      console.log(addCompanyL);
      this.startLoading = true;
      this.companyService
        .addCompanyL(addCompanyL)
        .then((results) => {
          console.log(results);
          this.startLoading = false;
        })
        .catch((err) => {
          this.submitFailed();
          this.loadingEnd.emit();
          this.startLoading = false;
          throw err;
        });
    }
  }

  // private addVendorRegistration(result: AddCompany) {
  //   this.loadingStart.emit();
  //   this.requestService
  //     .performPost(`/Company/AddCompanyBankL`, result)
  //     .subscribe({
  //       next: (result) => {
  //         this.submitSuccessfull();
  //         this.loadingEnd.emit();
  //       },
  //       error: (err) => {
  //         this.submitFailed();
  //         this.loadingEnd.emit();
  //         throw err;
  //       },
  //     });
  // }

  closeDialog() {
    this.dialogRef.close('Vendor dialog closed');
  }

  submitSuccessfull() {
    let dialog = AppUtilities.openSuccessMessageBox(
      this.successMessageBox,
      this.translocoService.translate(
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
    AppUtilities.noInternetError(this.displayMessageBox, this.translocoService);
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
}
