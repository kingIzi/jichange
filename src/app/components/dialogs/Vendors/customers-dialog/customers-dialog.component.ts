import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { SubmitMessageBoxComponent } from '../../submit-message-box/submit-message-box.component';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Customer } from 'src/app/core/models/vendors/customer';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoginResponse } from 'src/app/core/models/login-response';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { CustomerService } from 'src/app/core/services/vendor/customers/customer.service';
import { AddCustomerForm } from 'src/app/core/models/vendors/forms/add-customer-form';

@Component({
  selector: 'app-customers-dialog',
  templateUrl: './customers-dialog.component.html',
  styleUrls: ['./customers-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    SubmitMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    PhoneNumberInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/customer', alias: 'customer' },
    },
  ],
})
export class CustomersDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public userProfile!: LoginResponse;
  public customerForm!: FormGroup;
  //public attachInvoice = new EventEmitter<number>();
  public addedCustomer = new EventEmitter<void>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('submitMessagBox') submitMessagBox!: SubmitMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private tr: TranslocoService,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: Customer
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private formErrors(errorsPath: string = 'customer.form.dialog') {
    if (this.CName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customerName`)
      );
    }
    if (this.Mobile_Number.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.mobileNo`)
      );
    }
    if (this.Mail.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.emailId`)
      );
    }
  }
  private createForm() {
    this.customerForm = this.fb.group({
      compid: this.fb.control(this.userProfile.InstID, []),
      userid: this.fb.control(this.userProfile.Usno, []),
      CSno: this.fb.control(0, []),
      CName: this.fb.control('', [Validators.required]),
      PostboxNo: this.fb.control('', []),
      Address: this.fb.control('', []),
      regid: this.fb.control(0, []),
      distsno: this.fb.control(0, []),
      wardsno: this.fb.control(0, []),
      Tinno: this.fb.control('', []),
      VatNo: this.fb.control('', []),
      CoPerson: this.fb.control('', []),
      Mail: this.fb.control('', [Validators.email]),
      Mobile_Number: this.fb.control('', [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      dummy: this.fb.control(true, []),
      check_status: this.fb.control(''),
    });
  }
  private createEditForm() {
    this.customerForm = this.fb.group({
      compid: this.fb.control(this.userProfile.InstID, []),
      userid: this.fb.control(this.userProfile.Usno, []),
      CSno: this.fb.control(this.data.Cust_Sno, []),
      CName: this.fb.control(this.data.Cust_Name, [Validators.required]),
      PostboxNo: this.fb.control('', []),
      Address: this.fb.control('', []),
      regid: this.fb.control(0, []),
      distsno: this.fb.control(0, []),
      wardsno: this.fb.control(0, []),
      Tinno: this.fb.control('', []),
      VatNo: this.fb.control('', []),
      CoPerson: this.fb.control('', []),
      Mail: this.fb.control(this.data.Email, [Validators.email]),
      Mobile_Number: this.fb.control(this.data.Phone, [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      dummy: this.fb.control(true, []),
      check_status: this.fb.control(''),
    });
  }
  private requestAddCustomer(body: AddCustomerForm) {
    this.startLoading = true;
    this.customerService
      .addCustomer(body)
      .then((result) => {
        if (typeof result.response === 'boolean') {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`customer.form.dialog.failedToAddCustomer`)
          );
        } else if (
          typeof result.response === 'string' &&
          result.response.toLocaleLowerCase() ===
            'Customer already mapped to an Invoice'.toLocaleLowerCase()
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(
              `customer.form.dialog.addFailedCustomerMappedToInvoice`
            )
          );
        } else if (typeof result.response === 'number' && result.response > 0) {
          let success = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`customer.addedCustomerSuccessfully`)
          );
          this.addedCustomer.emit();
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
    if (this.data) {
      this.createEditForm();
    } else {
      this.createForm();
    }
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  updatePhoneNumberPrefix(prefix: string, control: FormControl) {
    AppUtilities.mobileNumberFormat(prefix, control);
  }
  submitCustomerForm(dialog: HTMLDialogElement) {
    if (this.customerForm.valid) {
      dialog.showModal();
    } else {
      this.customerForm.markAllAsTouched();
      //this.formErrors();
    }
  }
  // addCustomer(attachInvoice: boolean, dialog: HTMLDialogElement) {
  //   dialog.close();
  //   this.requestAddCustomer(this.customerForm.value, attachInvoice);
  // }
  addCustomer() {
    this.requestAddCustomer(this.customerForm.value);
  }
  get CName() {
    return this.customerForm.get('CName') as FormControl;
  }
  get Mobile_Number() {
    return this.customerForm.get('Mobile_Number') as FormControl;
  }
  get Mail() {
    return this.customerForm.get('Mail') as FormControl;
  }
}
