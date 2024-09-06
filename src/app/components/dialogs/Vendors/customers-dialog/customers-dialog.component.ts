import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
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
import { SubmitMessageBoxComponent } from '../../submit-message-box/submit-message-box.component';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Customer } from 'src/app/core/models/vendors/customer';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { PhoneNumberInputComponent } from 'src/app/reusables/phone-number-input/phone-number-input.component';
import { CustomerService } from 'src/app/core/services/vendor/customers/customer.service';
import { AddCustomerForm } from 'src/app/core/models/vendors/forms/add-customer-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { OptionalConfirmMessageBoxComponent } from '../../optional-confirm-message-box/optional-confirm-message-box.component';
import { from } from 'rxjs';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    OptionalConfirmMessageBoxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/customer', alias: 'customer' },
    },
  ],
})
export class CustomersDialogComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public customerForm!: FormGroup;
  public addedCustomer = new EventEmitter<Customer>();
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('submitMessagBox') submitMessagBox!: SubmitMessageBoxComponent;
  @ViewChild('optionalConfirmMessageBox')
  optionalConfirmMessageBox!: OptionalConfirmMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private tr: TranslocoService,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(MAT_DIALOG_DATA)
    public data: { customer: Customer; allowAttachInvoice: boolean }
  ) {}
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
      compid: this.fb.control(this.getUserProfile().InstID, []),
      userid: this.fb.control(this.getUserProfile().Usno, []),
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
      Mobile_Number: this.fb.control('', [Validators.required]),
      dummy: this.fb.control(true, []),
      check_status: this.fb.control(''),
    });
  }
  private createEditForm() {
    this.customerForm = this.fb.group({
      compid: this.fb.control(this.getUserProfile().InstID, []),
      userid: this.fb.control(this.getUserProfile().Usno, []),
      CSno: this.fb.control(this.data.customer.Cust_Sno, []),
      CName: this.fb.control(this.data.customer.Cust_Name, [
        Validators.required,
      ]),
      PostboxNo: this.fb.control('', []),
      Address: this.fb.control('', []),
      regid: this.fb.control(0, []),
      distsno: this.fb.control(0, []),
      wardsno: this.fb.control(0, []),
      Tinno: this.fb.control('', []),
      VatNo: this.fb.control('', []),
      CoPerson: this.fb.control('', []),
      Mail: this.fb.control(this.data.customer.Email, [Validators.email]),
      Mobile_Number: this.fb.control(this.data.customer.Phone, [
        Validators.required,
        Validators.pattern(AppUtilities.phoneNumberPrefixRegex),
      ]),
      dummy: this.fb.control(true, []),
      check_status: this.fb.control(''),
    });
  }
  private switchAddCustomerErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.CName.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing Company Id'.toLocaleLowerCase():
        return this.tr.translate(`errors.missingUserIdMessage`);
      case 'Missing Customer name'.toLocaleLowerCase():
        return this.tr.translate('customer.form.dialog.customerName');
      case 'Missing Mobile Number'.toLocaleLowerCase():
        return this.tr.translate('customer.form.dialog.mobileNo');
      case 'Exists name'.toLocaleLowerCase():
        return this.tr
          .translate('customer.form.dialog.existsName')
          .replace('{}', this.CName.value);
      case 'Exists phone'.toLocaleLowerCase():
        return this.tr.translate('customer.form.dialog.existsMobileNumber');
      case 'Exists tin'.toLocaleLowerCase():
        return this.tr.translate('customer.form.dialog.existsTin');
      case 'Exists email'.toLocaleLowerCase():
        return this.tr.translate('customer.form.dialog.existsEmail');
      default:
        return this.tr.translate(`customer.form.dialog.failedToAddCustomer`);
    }
  }
  private parseAddCustomerResponse(
    result: HttpDataResponse<number | Customer>,
    successMessage: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchAddCustomerErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      AppUtilities.showSuccessMessage(
        successMessage,
        () => {},
        this.tr.translate('actions.ok')
      );
      this.addedCustomer.emit(result.response as Customer);
    }
  }
  private routeToAddInvoice(customerId: number) {
    let link = `/vendor/customers/${customerId}/add/add`;
    this.router.navigate([link], {
      queryParams: { customerId: btoa(customerId.toString()) },
    });
  }
  private requestAddCustomerAttachedToInvoice(
    body: AddCustomerForm,
    successMessage: string
  ) {
    this.startLoading = true;
    let addedCustomer = from(this.customerService.addCustomer(body));
    addedCustomer.subscribe({
      next: (result) => {
        this.parseAddCustomerResponse(result, successMessage);
        let isErrorResult = AppUtilities.hasErrorResult(result);
        if (!isErrorResult) {
          let customer = result.response as Customer;
          this.routeToAddInvoice(customer.Cust_Sno);
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  private requestAddCustomer(body: AddCustomerForm, successMessage: string) {
    this.startLoading = true;
    let addedCustomer = from(this.customerService.addCustomer(body));
    addedCustomer.subscribe({
      next: (result) => {
        this.parseAddCustomerResponse(result, successMessage);
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  private confirmAddModifyCustomerDialog() {
    if (this?.data?.customer) {
      this.optionalConfirmMessageBox.modify();
    } else if (!this?.data?.customer && !this?.data?.allowAttachInvoice) {
      this.optionalConfirmMessageBox.create(false);
    } else if (!this?.data?.customer) {
      this.optionalConfirmMessageBox.create(true);
    }
  }
  private optionalConfirmMessageBoxEventHandler() {
    this.optionalConfirmMessageBox.optionalChoice.asObservable().subscribe({
      next: () => {
        //this.addCustomer();
        let message = this.tr.translate(`customer.addedCustomerSuccessfully`);
        this.requestAddCustomerAttachedToInvoice(
          this.customerForm.value,
          message
        );
      },
      error: (err) => {
        throw err;
      },
    });
    this.optionalConfirmMessageBox.defaultChoice.asObservable().subscribe({
      next: () => {
        this.addCustomer();
      },
      error: (err) => {
        throw err;
      },
    });
  }
  ngOnInit(): void {
    if (this?.data?.customer) {
      this.createEditForm();
    } else {
      this.createForm();
    }
  }
  ngAfterViewInit(): void {
    this.optionalConfirmMessageBoxEventHandler();
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
  updatePhoneNumberPrefix(prefix: string, control: FormControl) {
    AppUtilities.mobileNumberFormat(prefix, control);
  }
  submitCustomerForm(dialog: HTMLDialogElement) {
    this.confirmAddModifyCustomerDialog();
    if (this.customerForm.valid) {
      this.optionalConfirmMessageBox.openDialog();
    } else {
      this.customerForm.markAllAsTouched();
    }
  }
  addCustomer() {
    if (this.data?.customer) {
      let message = this.tr.translate(`customer.modifiedCustomerSuccessfully`);
      this.requestAddCustomer(this.customerForm.value, message);
    } else {
      let message = this.tr.translate(`customer.addedCustomerSuccessfully`);
      this.requestAddCustomer(this.customerForm.value, message);
    }
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
