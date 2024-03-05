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
import { AddCompanyBankL } from 'src/app/core/models/add-company-bank-l';
import { SuccessMessageBoxComponent } from '../success-message-box/success-message-box.component';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';

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
  ],
})
export class VendorRegistrationComponent implements OnInit {
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
    private requestService: RequestClientService,
    private fb: FormBuilder,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createVendorForm();
    this.requestBranchDetails();
  }

  createVendorForm() {
    this.vendorFormGroup = this.fb.group({
      CompName: this.fb.control('', [Validators.required]),
      MobNo: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^[0-9]{12}/),
      ]),
      BranchName: this.fb.control('', [Validators.required]),
      AccountNo: this.fb.control('', [Validators.required]),
      Checker: this.fb.control('', [Validators.required]),
    });
  }

  updatePhoneNumberPrefix(prefix: string, control: FormControl) {
    AppUtilities.mobileNumberFormat(prefix, control);
  }

  private formErrors(
    errorsPath: string = 'auth.vendorRegistration.form.errors.dialogs'
  ) {
    if (this.CompName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingVendorName`)
      );
    } else if (this.MobNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingPhoneNo`)
      );
    } else if (this.BranchName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingBranchName`)
      );
    } else if (this.AccountNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.missingAccountNo`)
      );
    } else if (this.Checker.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidFormError`),
        this.translocoService.translate(`${errorsPath}.makerChecker`)
      );
    }
  }

  submitVendor() {
    if (this.vendorFormGroup.valid) {
      console.log(this.vendorFormGroup.value);
      return;
    }
    this.vendorFormGroup.markAllAsTouched();
    this.formErrors();
  }

  private addVendorRegistration(result: AddCompanyBankL) {
    this.loadingStart.emit();
    this.requestService
      .performPost(`/Company/AddCompanyBankL`, result)
      .subscribe({
        next: (result) => {
          this.submitSuccessfull();
          this.loadingEnd.emit();
        },
        error: (err) => {
          this.submitFailed();
          this.loadingEnd.emit();
          throw err;
        },
      });
  }

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

  private requestBranchDetails() {
    this.loadingStart.emit();
    this.requestService
      .performGet<BranchDetail>('/EMPLOYDET/GetBranchDetails')
      .subscribe({
        next: (result) => {
          this.loadingEnd.emit();
          this.branchDetails = result as BranchDetail[];
        },
        error: (err) => {
          this.loadingEnd.emit();
          this.submitFailed();
          throw err;
        },
      });
  }

  get CompName() {
    return this.vendorFormGroup.get('CompName') as FormControl;
  }

  get MobNo() {
    return this.vendorFormGroup.get('MobNo') as FormControl;
  }

  get BranchName() {
    return this.vendorFormGroup.get('BranchName') as FormControl;
  }

  get AccountNo() {
    return this.vendorFormGroup.get('AccountNo') as FormControl;
  }

  get Checker() {
    return this.vendorFormGroup.get('Checker') as FormControl;
  }
}
