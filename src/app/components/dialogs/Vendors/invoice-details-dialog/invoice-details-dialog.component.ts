import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
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
import { BranchDialogComponent } from '../../bank/setup/branch-dialog/branch-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import * as json from 'src/assets/temp/data.json';
import { Customer } from 'src/app/core/models/vendors/customer';
import { Router } from '@angular/router';
import { ConfirmAddCustomerDialogComponent } from './confirm-add-customer-dialog/confirm-add-customer-dialog.component';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';

@Component({
  selector: 'app-invoice-details-dialog',
  templateUrl: './invoice-details-dialog.component.html',
  styleUrls: ['./invoice-details-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    ConfirmAddCustomerDialogComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class InvoiceDetailsDialogComponent implements OnInit {
  public customers: Customer[] = [];
  public invoiceDetailsForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddCustomer')
  confirmAddCustomer!: ConfirmAddCustomerDialogComponent;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private translocoService: TranslocoService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  private createAttachedCustomer(invoice: any) {
    this.invoiceDetailsForm = this.fb.group({
      invoiceNo: this.fb.control('', [Validators.required]),
      invoiceDate: this.fb.control('', [Validators.required]),
      dueDate: this.fb.control('', [Validators.required]),
      invoiceExpire: this.fb.control('', [Validators.required]),
      customer: this.fb.control(invoice.customer.Cust_Name, [
        Validators.required,
      ]),
      paymentType: this.fb.control('', [Validators.required]),
      status: this.fb.control('', [Validators.required]),
      itemDetails: this.fb.array([], [Validators.required]),
    });
    this.customer.disable();
  }
  private createGeneratedInvoiceViewForm(generatedInvoice: GeneratedInvoice) {
    this.invoiceDetailsForm = this.fb.group({
      invoiceNo: this.fb.control(generatedInvoice.Invoice_No, [
        Validators.required,
      ]),
      invoiceDate: this.fb.control(
        AppUtilities.dateToFormat(
          AppUtilities.convertDotNetJsonDateToDate(
            generatedInvoice.Invoice_Date.toString()
          ),
          'yyyy-MM-dd'
        ),
        [Validators.required]
      ),
      dueDate: this.fb.control(
        AppUtilities.dateToFormat(
          AppUtilities.convertDotNetJsonDateToDate(
            generatedInvoice.Due_Date.toString()
          ),
          'yyyy-MM-dd'
        ),
        [Validators.required]
      ),
      invoiceExpire: this.fb.control(
        AppUtilities.dateToFormat(
          AppUtilities.convertDotNetJsonDateToDate(
            generatedInvoice.Invoice_Expired_Date.toString()
          ),
          'yyyy-MM-dd'
        ),
        [Validators.required]
      ),
      customer: this.fb.control(generatedInvoice.Chus_Name.trim(), [
        Validators.required,
      ]),
      paymentType: this.fb.control(generatedInvoice.Payment_Type.trim(), [
        Validators.required,
      ]),
      status: this.fb.control('', [Validators.required]),
      itemDetails: this.fb.array([], [Validators.required]),
    });
    let data = JSON.parse(JSON.stringify(json));
    let items: any[] = data.items;
    items.forEach((i) => {
      let group = this.fb.group({
        description: this.fb.control(i.description, []),
        quantity: this.fb.control(i.quantity, []),
        unitPrice: this.fb.control(i.price, []),
        totalAmount: this.fb.control(i.quantity * i.price, []),
        remarks: this.fb.control('', []),
      });
      this.itemDetails.push(group);
    });
  }
  private createForm() {
    this.invoiceDetailsForm = this.fb.group({
      invoiceNo: this.fb.control('', [Validators.required]),
      invoiceDate: this.fb.control('', [Validators.required]),
      dueDate: this.fb.control('', [Validators.required]),
      invoiceExpire: this.fb.control('', [Validators.required]),
      customer: this.fb.control('', [Validators.required]),
      paymentType: this.fb.control('', [Validators.required]),
      status: this.fb.control('', [Validators.required]),
      itemDetails: this.fb.array([], [Validators.required]),
    });
  }
  private openAddCustomerConfirmForm() {
    AppUtilities.openDialog(
      this.confirmAddCustomer,
      this.translocoService.translate('invoice.form.actions.confirm'),
      this.translocoService.translate(
        'invoice.form.actions.areYouSureYouWantToAddANewCustomer'
      )
    );
  }
  private formErrors(errorsPath: string = 'invoice.form.dialog') {
    if (this.invoiceNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.invoiceNo`)
      );
    }
    if (this.invoiceDate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.invoiceDate`)
      );
    }
    if (this.dueDate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.dueDate`)
      );
    }
    if (this.invoiceExpire.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.invoiceExpire`)
      );
    }
    if (this.customer.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.customer`)
      );
    }
    if (this.paymentType.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.paymentType`)
      );
    }
    if (this.status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.status`)
      );
    }
  }
  private decreasetAmountByDiscount(sum: number, percentage: number) {
    let decimalPercentage = percentage / 100;
    let decreaseAmount = sum * decimalPercentage;
    let decreasedSum = sum - decreaseAmount;
    return decreasedSum;
  }
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
    this.customers = data.customers;
    switch (true) {
      case !this.data:
        this.createForm();
        break;
      case !!this.data.customer:
        this.createAttachedCustomer(this.data);
        break;
      case !!this.data.generatedInvoice:
        this.createGeneratedInvoiceViewForm(this.data.generatedInvoice);
        break;
      default:
        // Handle default case if needed
        break;
    }
    this.addItemDetail();
  }
  addItemDetail(ind: number = -1) {
    let group = this.fb.group({
      description: this.fb.control('', []),
      quantity: this.fb.control(0, []),
      unitPrice: this.fb.control(0, []),
      totalAmount: this.fb.control(0, []),
      remarks: this.fb.control('', []),
    });
    group.get('quantity')?.valueChanges.subscribe(() => {
      if (
        Number(group.get('quantity')?.value) &&
        Number(group.get('quantity')?.value) > 0 &&
        Number(group.get('unitPrice')?.value) &&
        Number(group.get('unitPrice')?.value) > 0
      ) {
        group
          .get('totalAmount')
          ?.setValue(
            Number(group.get('quantity')?.value) *
              Number(group.get('unitPrice')?.value)
          );
      }
    });
    group.get('unitPrice')?.valueChanges.subscribe(() => {
      if (
        Number(group.get('unitPrice')?.value) &&
        Number(group.get('unitPrice')?.value) > 0 &&
        Number(group.get('quantity')?.value) &&
        Number(group.get('quantity')?.value) > 0
      ) {
        group
          .get('totalAmount')
          ?.setValue(
            Number(group.get('unitPrice')?.value) *
              Number(group.get('quantity')?.value)
          );
      }
    });
    let MAX = 10;
    if (
      ind > -1 &&
      this.itemDetails.at(ind).valid &&
      this.itemDetails.length < MAX
    ) {
      this.itemDetails.insert(ind + 1, group);
    } else if (ind > -1 && this.itemDetails.at(ind).invalid) {
      this.itemDetails.at(ind).markAllAsTouched();
    } else if (this.itemDetails.length < MAX) {
      this.itemDetails.push(group);
    } else if (this.itemDetails.length === MAX) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`invoice.form.dialog.invalidForm`),
        this.translocoService
          .translate(`invoice.form.dialog.maximumItemDetails`)
          .replace('{}', MAX.toString())
      );
    }
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitInvoiceDetailsForm() {
    if (this.invoiceDetailsForm.valid) {
      console.log(this.invoiceDetailsForm.value);
    }
    this.invoiceDetailsForm.markAllAsTouched();
    this.formErrors();
  }
  removeItemDetail(ind: number) {
    this.itemDetails.removeAt(ind);
  }
  accumulateData() {
    let sumAmount = this.itemDetails.controls.reduce(
      (accumulator, currentValue) => {
        return accumulator + currentValue.get('totalAmount')?.value;
      },
      0
    );
    let estimate = this.decreasetAmountByDiscount(sumAmount, 40);
    return AppUtilities.moneyFormat(estimate.toString());
  }
  setItemDetailAmount(ind: number, amount: number) {
    this.itemDetails.at(ind).get('totalAmount')?.setValue(amount);
  }
  changeCustomer(value: string) {
    let addCustomer = this.translocoService.translate(
      `invoice.form.addNewCustomer`
    );
    if (value.toLocaleLowerCase() === addCustomer.toLocaleLowerCase()) {
      this.openAddCustomerConfirmForm();
      this.confirmAddCustomer.confirm.asObservable().subscribe(() => {
        this.router.navigate(['/vendor/customers', { addCustomer: true }]);
        this.closeDialog();
      });
    }
  }
  clickAddCustomer() {
    alert(12);
  }
  get invoiceNo() {
    return this.invoiceDetailsForm.get('invoiceNo') as FormControl;
  }
  get invoiceDate() {
    return this.invoiceDetailsForm.get('invoiceDate') as FormControl;
  }
  get dueDate() {
    return this.invoiceDetailsForm.get('dueDate') as FormControl;
  }
  get invoiceExpire() {
    return this.invoiceDetailsForm.get('invoiceExpire') as FormControl;
  }
  get customer() {
    return this.invoiceDetailsForm.get('customer') as FormControl;
  }
  get paymentType() {
    return this.invoiceDetailsForm.get('paymentType') as FormControl;
  }
  get status() {
    return this.invoiceDetailsForm.get('status') as FormControl;
  }
  get itemDetails() {
    return this.invoiceDetailsForm.get('itemDetails') as FormArray;
  }
}
