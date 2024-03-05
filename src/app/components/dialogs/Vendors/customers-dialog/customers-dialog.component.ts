import { CommonModule } from '@angular/common';
import {
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
import { ActivatedRoute, Router } from '@angular/router';
import { Customer } from 'src/app/core/models/vendors/customer';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/customer', alias: 'customer' },
    },
  ],
})
export class CustomersDialogComponent implements OnInit {
  public customerForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('submitMessagBox') submitMessagBox!: SubmitMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private translocoService: TranslocoService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: Customer
  ) {}
  ngOnInit(): void {
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
  private showFormReady(value: any) {
    AppUtilities.openSubmitMessageBox(
      this.submitMessagBox,
      this.translocoService.translate(
        'customer.form.actions.sureToAddCustomer'
      ),
      this.translocoService.translate('customer.form.actions.addInvoiceAsWell')
    );
  }
  submitCountryForm() {
    if (this.customerForm.valid) {
      this.showFormReady(this.customerForm.value);
      this.submitMessagBox.attachInvoice.asObservable().subscribe(() => {
        this.router.navigate(['/vendor/invoice/20123']);
        this.closeDialog();
      });
      this.submitMessagBox.addCustomer.asObservable().subscribe(() => {
        this.closeDialog();
      });
    }
    this.customerForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'customer.form.dialog') {
    if (this.customerName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.customerName`)
      );
    }
    if (this.mobileNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.mobileNo`)
      );
    }
    if (this.emailId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.emailId`)
      );
    }
  }
  private createForm() {
    this.customerForm = this.fb.group({
      customerName: this.fb.control('', [Validators.required]),
      mobileNo: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^[0-9]{12}/),
      ]),
      emailId: this.fb.control('', [Validators.email]),
    });
  }
  private createEditForm() {
    this.customerForm = this.fb.group({
      customerName: this.fb.control(this.data.Cust_Name, [Validators.required]),
      mobileNo: this.fb.control(this.data.Phone, [
        Validators.required,
        Validators.pattern(/^[0-9]{12}/),
      ]),
      emailId: this.fb.control(this.data.Email, [Validators.email]),
    });
  }
  get customerName() {
    return this.customerForm.get('customerName') as FormControl;
  }
  get mobileNo() {
    return this.customerForm.get('mobileNo') as FormControl;
  }
  get emailId() {
    return this.customerForm.get('emailId') as FormControl;
  }
}
