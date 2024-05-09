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
import { LoginResponse } from 'src/app/core/models/login-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { Currency } from 'src/app/core/models/vendors/currency';
import { AddInvoiceForm } from 'src/app/core/models/vendors/forms/add-invoice-form';

@Component({
  selector: 'app-invoice-details-dialog',
  templateUrl: './invoice-details-dialog.component.html',
  styleUrls: ['./invoice-details-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    ConfirmAddCustomerDialogComponent,
    LoaderRainbowComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class InvoiceDetailsDialogComponent implements OnInit {
  public startLoading: boolean = false;
  private userProfile!: LoginResponse;
  public generatedInvoice!: GeneratedInvoice;
  public invoices: GeneratedInvoice[] = [];
  public customers: { Cus_Mas_Sno: number; Customer_Name: string }[] = [];
  public currencies: Currency[] = [];
  public companies!: { Comp_Mas_Sno: number; Company_Name: string };
  public invoiceDetailsForm!: FormGroup;
  public addedInvoice = new EventEmitter<any>();
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
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
    private tr: TranslocoService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: { userProfile: LoginResponse; invid: number } //@Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private modifyInvoiceDetailsForm() {
    this.invno.setValue(this.generatedInvoice.Invoice_No);
    this.date.setValue(
      AppUtilities.dateToFormat(
        new Date(this.generatedInvoice.Invoice_Date),
        'yyyy-MM-dd'
      )
    );
    this.edate.setValue('');
    this.iedate.setValue('');
    this.ptype.setValue('MasterCard');
    this.chus.setValue(this.generatedInvoice.Chus_Mas_No);
    this.ccode.setValue(this.generatedInvoice.Currency_Code);
    this.appendItems();
  }
  private appendItems() {
    this.invoices.forEach((item) => {
      let group = this.fb.group({
        item_description: this.fb.control(item?.Item_Description?.trim(), []),
        item_qty: this.fb.control(Math.floor(item?.Item_Qty), []),
        item_unit_price: this.fb.control(item.Item_Unit_Price, []),
        item_total_amount: this.fb.control(item.Item_Total_Amount, []),
        remarks: this.fb.control(item?.Remarks?.trim()),
      });
      this.details.push(group);
    });
  }
  private createGeneratedInvoiceViewForm() {
    this.startLoading = true;
    let invoiceDetailsObservable = from(
      this.invoiceService.invoiceDetailsById({
        compid: this.data.userProfile.InstID,
        invid: Number(this.data.invid),
      })
    );
    let invoiceItemObservable = from(
      this.invoiceService.invoiceItemDetails({
        invid: Number(this.data.invid),
      })
    );
    let mergedObservable = zip(invoiceDetailsObservable, invoiceItemObservable);
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
      .then((results: Array<any>) => {
        let [invoiceDetails, invoiceItem] = results;
        this.generatedInvoice =
          invoiceDetails.response === 0 ? {} : invoiceDetails.response;
        this.invoices = invoiceItem.response === 0 ? [] : invoiceItem.response;
        this.startLoading = false;
        this.modifyInvoiceDetailsForm();
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  private createForm() {
    this.invoiceDetailsForm = this.fb.group({
      user_id: this.fb.control(this.userProfile.Usno, [Validators.required]),
      compid: this.fb.control(this.userProfile.InstID.toString(), [
        Validators.required,
      ]),
      auname: this.fb.control('', [Validators.required]),
      invno: this.fb.control('', [Validators.required]),
      date: this.fb.control('', [Validators.required]),
      edate: this.fb.control('', [Validators.required]),
      iedate: this.fb.control('', [Validators.required]),
      ptype: this.fb.control('', [Validators.required]),
      chus: this.fb.control('', [Validators.required]),
      ccode: this.fb.control('', [Validators.required]),
      comno: this.fb.control(0, [Validators.required]),
      ctype: this.fb.control('0', [Validators.required]),
      cino: this.fb.control('0', [Validators.required]),
      twvat: this.fb.control(0, [Validators.required]),
      vtamou: this.fb.control(0, [Validators.required]),
      lastrow: this.fb.control(0, [Validators.required]),
      Inv_remark: this.fb.control('', [Validators.required]),
      total: this.fb.control('', [Validators.required]),
      details: this.fb.array([], [Validators.required]),
    });
  }
  private openAddCustomerConfirmForm() {
    AppUtilities.openDialog(
      this.confirmAddCustomer,
      this.tr.translate('invoice.form.actions.confirm'),
      this.tr.translate(
        'invoice.form.actions.areYouSureYouWantToAddANewCustomer'
      )
    );
  }
  private formErrors(errorsPath: string = 'invoice.form.dialog') {
    if (this.invno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.invoiceNo`)
      );
    }
    if (this.date.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.invoiceDate`)
      );
    }
    if (this.edate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.dueDate`)
      );
    }
    if (this.iedate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.invoiceExpire`)
      );
    }
    if (this.chus.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
      );
    }
    if (this.ptype.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.paymentType`)
      );
    }
    if (this.ccode.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.status`)
      );
    }
    if (this.total.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.total`)
      );
    }
  }
  private invoiceFormExistsMessage() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`defaults.failed`),
      this.tr.translate(`invoice.form.dialog.invoiceExists`)
    );
  }
  private invoiceAddedSuccesfullyMessage() {
    let dialog = AppUtilities.openSuccessMessageBox(
      this.successMessageBox,
      this.tr.translate('invoice.form.dialog.addedInvoiceSuccessfully')
    );
    dialog.addEventListener('close', () => {
      this.closeDialog();
    });
  }
  private requestAddInvoiceForm(value: AddInvoiceForm) {
    this.startLoading = true;
    this.invoiceService
      .addInvoice(value)
      .then((results: any) => {
        this.startLoading = false;
        if (results.response === 0 || results.response === 'EXIST') {
          this.invoiceFormExistsMessage();
        } else {
          this.invoiceAddedSuccesfullyMessage();
        }
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
  private buildPage() {
    this.startLoading = true;
    let customerNamesObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.userProfile.InstID,
      })
    );
    let currenciesObservable = from(this.invoiceService.getCurrencyCodes());
    let mergedObservable = zip(customerNamesObservable, currenciesObservable);
    lastValueFrom(
      mergedObservable.pipe(
        map((result) => {
          return result;
        }),
        catchError((err) => {
          throw err;
        })
      )
    )
      .then((results: Array<any>) => {
        let [customers, currencies] = results;
        this.customers = customers.response === 0 ? [] : customers.response;
        this.currencies = currencies.response === 0 ? [] : currencies.response;
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createForm();
    this.buildPage();
    if (this.data && this.data.invid) {
      this.createGeneratedInvoiceViewForm();
    } else {
      this.addItemDetail();
    }
  }
  addItemDetail(ind: number = -1) {
    let group = this.fb.group({
      item_description: this.fb.control('', [Validators.required]),
      item_qty: this.fb.control(0, [Validators.required, Validators.min(1)]),
      item_unit_price: this.fb.control(0, [
        Validators.required,
        Validators.min(1),
      ]),
      item_total_amount: this.fb.control(0, [Validators.required]),
      remarks: this.fb.control('', []),
    });
    group.get('item_unit_price')?.valueChanges.subscribe((value) => {
      let itemQtyControl = group.get('item_qty');
      if (
        value &&
        itemQtyControl?.value &&
        value > 0 &&
        itemQtyControl?.value > 0
      ) {
        let acc = value * itemQtyControl?.value;
        group.get('item_total_amount')?.setValue(acc);
      }
    });
    group.get('item_qty')?.valueChanges.subscribe((value) => {
      let itemUnitPriceCOntrol = group.get('item_unit_price');
      if (
        value &&
        itemUnitPriceCOntrol?.value &&
        value > 0 &&
        itemUnitPriceCOntrol?.value > 0
      ) {
        let acc = value * itemUnitPriceCOntrol?.value;
        group.get('item_total_amount')?.setValue(acc);
      }
    });
    if (this.details.length === 0) {
      this.details.push(group);
    } else {
      let curr = this.details.controls.at(ind);
      curr?.markAllAsTouched();
      if (curr?.valid) {
        this.details.push(group);
      }
    }
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close();
  }
  submitInvoiceDetailsForm() {
    if (this.invoiceDetailsForm.valid) {
      this.requestAddInvoiceForm(
        this.invoiceDetailsForm.value as AddInvoiceForm
      );
      return;
    }
    this.invoiceDetailsForm.markAllAsTouched();
    this.formErrors();
  }
  removeItemDetail(ind: number) {
    this.details.removeAt(ind);
  }
  accumulateData() {
    let sumAmount = this.details.controls.reduce(
      (accumulator, currentValue) => {
        return accumulator + currentValue.get('item_total_amount')?.value;
      },
      0
    );
    let moneyFormat = AppUtilities.moneyFormat(sumAmount.toString());
    this.total.setValue(moneyFormat);
    this.auname.setValue(moneyFormat);
    return moneyFormat;
  }
  setItemDetailAmount(ind: number, amount: number) {
    this.details.at(ind).get('item_total_amount')?.setValue(amount);
  }
  changeCustomer(value: string) {
    let addCustomer = this.tr.translate(`invoice.form.addNewCustomer`);
    if (value.toLocaleLowerCase() === addCustomer.toLocaleLowerCase()) {
      this.openAddCustomerConfirmForm();
      this.confirmAddCustomer.confirm.asObservable().subscribe(() => {
        this.router.navigate(['/vendor/customers', { addCustomer: true }]);
        this.closeDialog();
      });
    }
  }
  get invno() {
    return this.invoiceDetailsForm.get('invno') as FormControl;
  }
  get date() {
    return this.invoiceDetailsForm.get('date') as FormControl;
  }
  get edate() {
    return this.invoiceDetailsForm.get('edate') as FormControl;
  }
  get iedate() {
    return this.invoiceDetailsForm.get('iedate') as FormControl;
  }
  get ptype() {
    return this.invoiceDetailsForm.get('ptype') as FormControl;
  }
  get chus() {
    return this.invoiceDetailsForm.get('chus') as FormControl;
  }
  get ccode() {
    return this.invoiceDetailsForm.get('ccode') as FormControl;
  }
  get Inv_remark() {
    return this.invoiceDetailsForm.get('Inv_remark') as FormControl;
  }
  get total() {
    return this.invoiceDetailsForm.get('total') as FormControl;
  }
  get auname() {
    return this.invoiceDetailsForm.get('auname') as FormControl;
  }
  get details() {
    return this.invoiceDetailsForm.get('details') as FormArray;
  }
  get company() {
    return this.invoiceDetailsForm.get('company') as FormControl;
  }
}
