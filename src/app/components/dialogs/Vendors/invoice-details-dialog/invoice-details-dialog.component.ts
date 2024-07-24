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
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { BranchDialogComponent } from '../../bank/setup/branch-dialog/branch-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import * as json from 'src/assets/temp/data.json';
import { Customer } from 'src/app/core/models/vendors/customer';
import { Router } from '@angular/router';
import { ConfirmAddCustomerDialogComponent } from './confirm-add-customer-dialog/confirm-add-customer-dialog.component';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import {
  Observable,
  catchError,
  from,
  lastValueFrom,
  map,
  startWith,
  zip,
} from 'rxjs';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { Currency } from 'src/app/core/models/vendors/currency';
import { AddInvoiceForm } from 'src/app/core/models/vendors/forms/add-invoice-form';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { SubmitMessageBoxComponent } from '../../submit-message-box/submit-message-box.component';
import { CustomersDialogComponent } from '../customers-dialog/customers-dialog.component';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import { Autocomplete, Input, initTE } from 'tw-elements';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';

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
    LoaderInfiniteSpinnerComponent,
    SubmitMessageBoxComponent,
    MatDialogModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class InvoiceDetailsDialogComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public generatedInvoice!: GeneratedInvoice;
  public invoices: GeneratedInvoice[] = [];
  public customers: CustomerName[] = [];
  public filteredCustomers!: Observable<CustomerName[]>;
  public currencies: Currency[] = [];
  public companies!: { Comp_Mas_Sno: number; Company_Name: string };
  public invoiceDetailsForm!: FormGroup;
  public addedInvoice = new EventEmitter<any>();
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddCustomer')
  confirmAddCustomer!: ConfirmAddCustomerDialogComponent;
  @ViewChild('submitMessageBox') submitMessageBox!: SubmitMessageBoxComponent;
  @ViewChild('confirmAddInvoiceDetail')
  confirmAddInvoiceDetail!: ElementRef<HTMLDialogElement>;
  @ViewChild('customer', { static: true })
  customer!: ElementRef<HTMLInputElement>;
  constructor(
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private router: Router,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private tr: TranslocoService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      userProfile: VendorLoginResponse;
      invid: number;
      customerId: number;
    }
  ) {}
  private modifyInvoiceDetailsForm() {
    this.invno.setValue(this.generatedInvoice.Invoice_No);
    this.date.setValue(
      this.generatedInvoice.Invoice_Date
        ? AppUtilities.dateToFormat(
            new Date(this.generatedInvoice.Invoice_Date),
            'yyyy-MM-dd'
          )
        : ''
    );
    this.edate.setValue(
      this.generatedInvoice.Due_Date
        ? AppUtilities.dateToFormat(
            new Date(this.generatedInvoice.Due_Date),
            'yyyy-MM-dd'
          )
        : ''
    );
    this.iedate.setValue(
      this.generatedInvoice.Invoice_Expired_Date
        ? AppUtilities.dateToFormat(
            new Date(this.generatedInvoice.Invoice_Expired_Date),
            'yyyy-MM-dd'
          )
        : ''
    );
    this.ptype.setValue(
      this.generatedInvoice.Payment_Type
        ? this.generatedInvoice.Payment_Type
        : ''
    );
    if (this.data.customerId && this.data.customerId > 0) {
      this.customerName.setValue(this.data.customerId);
    } else {
      this.customerName.setValue(this.generatedInvoice.Chus_Name ?? '');
      this.chus.setValue(this.generatedInvoice.Chus_Mas_No);
    }
    //this.goods_status.setValue(this.generatedInvoice.goods_status);
    this.ccode.setValue(this.generatedInvoice.Currency_Code);
    this.Inv_remark.setValue(
      this.generatedInvoice.Remarks ? this.generatedInvoice.Remarks.trim() : ''
    );
    this.sno.setValue(this.generatedInvoice.Inv_Mas_Sno);

    this.appendItems();
    this.disableFormFields();
  }
  private disableFormFields() {
    this.invno.disable();
    this.date.disable();
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
      this.itemDetailQuantityPriceChanged(group);
    });
  }
  private autocompleteEventListener() {
    this.filteredCustomers = this.customerName.valueChanges.pipe(
      startWith(''),
      map((value) => this.customerAutoCompleteData(value || ''))
    );
  }
  private customerAutoCompleteData(value: string): CustomerName[] {
    let filterValue = value.toLocaleLowerCase();
    return this.customers.filter((customer) =>
      customer.Customer_Name.toLocaleLowerCase().includes(filterValue)
    );
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
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [invoiceDetail, invoiceItems] = results;
        let hasInvoiceDetail =
          invoiceDetail.response &&
          typeof invoiceDetail.response !== 'string' &&
          typeof invoiceDetail.response !== 'number';
        let hasInvoiceItems =
          invoiceItems.response &&
          typeof invoiceItems.response !== 'string' &&
          typeof invoiceItems.response !== 'number';
        if (hasInvoiceDetail && hasInvoiceItems) {
          this.generatedInvoice = invoiceDetail.response;
          this.invoices = invoiceItems.response;
          this.modifyInvoiceDetailsForm();
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
  private createForm() {
    this.invoiceDetailsForm = this.fb.group({
      user_id: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      compid: this.fb.control(this.getUserProfile().InstID.toString(), [
        Validators.required,
      ]),
      auname: this.fb.control('', [Validators.required]),
      invno: this.fb.control('', [Validators.required]),
      date: this.fb.control('', [Validators.required]),
      edate: this.fb.control('', [Validators.required]),
      iedate: this.fb.control('', [Validators.required]),
      ptype: this.fb.control('', [Validators.required]),
      chus: this.fb.control('', []),
      customerName: this.fb.control('', [Validators.required]),
      ccode: this.fb.control('', [Validators.required]),
      comno: this.fb.control(0, [Validators.required]),
      ctype: this.fb.control('0', [Validators.required]),
      cino: this.fb.control('0', [Validators.required]),
      twvat: this.fb.control(0, [Validators.required]),
      vtamou: this.fb.control(0, [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      lastrow: this.fb.control(0, [Validators.required]),
      Inv_remark: this.fb.control('', []),
      //goods_status: this.fb.control('', []),
      total: this.fb.control('', [Validators.required]),
      details: this.fb.array([], [Validators.required]),
    });
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
  private requestAddInvoiceForm(value: AddInvoiceForm) {
    this.startLoading = true;
    this.invoiceService
      .addInvoice(value)
      .then((results: any) => {
        if (results.response === 0 || results.response === 'EXIST') {
          this.invoiceFormExistsMessage();
        } else {
          let message = this.data.invid
            ? `invoice.form.dialog.modifiedSuccessfully`
            : `invoice.form.dialog.addedInvoiceSuccessfully`;
          let m = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(message)
          );
          this.addedInvoice.emit();
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
  private buildPage() {
    this.startLoading = true;
    let customerNamesObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.getUserProfile().InstID,
      })
    );
    let currenciesObservable = from(this.invoiceService.getCurrencyCodes());
    let mergedObservable = zip(customerNamesObservable, currenciesObservable);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [customers, currencies] = results;
        if (
          typeof customers.response !== 'string' &&
          typeof customers.response !== 'number'
        ) {
          this.customers = customers.response;
        }
        if (
          typeof currencies.response !== 'string' &&
          typeof currencies.response !== 'number'
        ) {
          this.currencies = currencies.response;
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
  private itemDetailQuantityPriceChanged(group: FormGroup) {
    group.get('item_unit_price')?.valueChanges.subscribe((value) => {
      let itemQtyControl = group.get('item_qty');
      if (value && itemQtyControl?.value && value > 0) {
        let acc = value * itemQtyControl?.value;
        group.get('item_total_amount')?.setValue(acc);
      }
    });
    group.get('item_qty')?.valueChanges.subscribe((value) => {
      let itemUnitPriceCOntrol = group.get('item_unit_price');
      if (value && itemUnitPriceCOntrol?.value && value > 0) {
        let acc = value * itemUnitPriceCOntrol?.value;
        group.get('item_total_amount')?.setValue(acc);
      }
    });
  }
  ngOnInit(): void {
    initTE({ Input });
    this.createForm();
    if (this.data && this.data.invid) {
      this.createGeneratedInvoiceViewForm();
    } else {
      this.addItemDetail();
    }
  }
  ngAfterViewInit(): void {
    this.buildPage();
    this.autocompleteEventListener();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
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
    this.itemDetailQuantityPriceChanged(group);
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
  closeDialog() {
    this.dialogRef.close();
  }
  submitInvoiceDetailsForm() {
    if (this.invoiceDetailsForm.valid) {
      let customer = this.customers.find(
        (c) =>
          c.Customer_Name.toLocaleLowerCase() ===
          this.customerName.value.toLocaleLowerCase()
      );
      this.chus.setValue(customer?.Cus_Mas_Sno);
      this.confirmAddInvoiceDetail.nativeElement.showModal();
    } else {
      this.invoiceDetailsForm.markAllAsTouched();
    }
  }
  addInvoice() {
    if (this.isEditable()) {
      let form = { ...this.invoiceDetailsForm.value };
      form.invno = this.invno.value;
      form.date = this.date.value;
      this.requestAddInvoiceForm(form);
    } else {
      this.requestAddInvoiceForm(this.invoiceDetailsForm.value);
    }
  }
  removeItemDetail(ind: number) {
    if (ind > 0) {
      this.details.removeAt(ind);
    }
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
    if (value.toLocaleLowerCase() != addCustomer.toLocaleLowerCase()) {
      return;
    }
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      disableClose: true,
    });
    // dialogRef.componentInstance.attachInvoice
    //   .asObservable()
    //   .subscribe((customerId) => {
    //     dialogRef.close();
    //     this.buildPage();
    //   });
    dialogRef.componentInstance.addedCustomer.asObservable().subscribe(() => {
      dialogRef.close();
      this.buildPage();
    });
  }
  isEditable(): boolean {
    return this.data && this.data.invid ? true : false;
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
  get sno() {
    return this.invoiceDetailsForm.get('sno') as FormControl;
  }
  get customerName() {
    return this.invoiceDetailsForm.get('customerName') as FormControl;
  }
  // private get goods_status() {
  //   return this.invoiceDetailsForm.get('goods_status') as FormControl;
  // }
}
