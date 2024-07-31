import { CommonModule, DatePipe, Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Observable, from, map, of, startWith, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Currency } from 'src/app/core/models/vendors/currency';
import { ActivatedRoute } from '@angular/router';
import { AddInvoiceForm } from 'src/app/core/models/vendors/forms/add-invoice-form';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { CustomersDialogComponent } from 'src/app/components/dialogs/Vendors/customers-dialog/customers-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Customer } from 'src/app/core/models/vendors/customer';

@Component({
  selector: 'app-add-invoice',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
  ],
  templateUrl: './add-invoice.component.html',
  styleUrl: './add-invoice.component.scss',
  providers: [
    DatePipe,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class AddInvoiceComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public invoiceDetailsForm!: FormGroup;
  public generatedInvoice!: Observable<GeneratedInvoice>;
  public invoiceItems: Observable<GeneratedInvoice[]> = of([]);
  public filteredCustomers: Observable<CustomerName[]> = of([]);
  public itemDetailQuantities: number[] = Array.from(
    { length: 19 - 1 + 1 },
    (_, i) => 1 + i
  );
  public formData: {
    customers: CustomerName[];
    currencies: Observable<Currency[]>;
  } = {
    customers: [],
    currencies: of([]),
  };
  @ViewChild('noCustomersFound', { static: true })
  noCustomersFound!: ElementRef<HTMLDialogElement>;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('confirmAddInvoiceDetail', { static: true })
  confirmAddInvoiceDetail!: ElementRef<HTMLDialogElement>;
  @ViewChild('customerNameInput')
  customerNameInput!: ElementRef<HTMLInputElement>;
  constructor(
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private invoiceService: InvoiceService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}
  private createForm() {
    this.invoiceDetailsForm = this.fb.group({
      userid: this.fb.control(this.appConfigService.getLoginResponse().Usno, [
        Validators.required,
      ]),
      compid: this.fb.control(this.getUserProfile().InstID.toString(), [
        Validators.required,
      ]),
      auname: this.fb.control('', [Validators.required]),
      invno: this.fb.control('', [Validators.required]),
      date: this.fb.control(new Date(), [Validators.required]),
      edate: this.fb.control('', [Validators.required]),
      iedate: this.fb.control('', [Validators.required]),
      ptype: this.fb.control('', [Validators.required]),
      chus: this.fb.control('', []),
      customerName: this.fb.control('', []),
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
    this.addItemDetail();
  }
  private invoiceFormExistsMessage() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`defaults.failed`),
      this.tr.translate(`invoice.form.dialog.invoiceExists`)
    );
  }
  private retrieveQueryParams() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['invno']) {
        let invno = atob(params['invno']);
        this.buildEditInvoiceForm(invno);
      }
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
  private autocompleteEventListener() {
    // this.filteredCustomers = this.customerName.valueChanges.pipe(
    //   startWith(''),
    //   map((value) => this.customerAutoCompleteData(value || ''))
    // );
    if (this.formData.customers.length > 0) {
      this.filteredCustomers = this.customerName.valueChanges.pipe(
        startWith(''),
        map((value) => this.customerAutoCompleteData(value || ''))
      );
    } else {
      this.noCustomersFound.nativeElement.showModal();
    }
  }
  private customerAutoCompleteData(value: string): CustomerName[] {
    let filterValue = value.toLocaleLowerCase();
    return this.formData.customers.filter((customer) =>
      customer.Customer_Name.toLocaleLowerCase().includes(filterValue)
    );
  }
  private assignCustomersFormData(
    result: HttpDataResponse<number | CustomerName[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.formData.customers = [];
    } else {
      this.formData.customers = result.response as CustomerName[];
    }
    this.autocompleteEventListener();
  }
  private assignCurrenciesFormData(
    result: HttpDataResponse<string | number | Currency[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.formData.currencies = of(result.response);
    } else {
      this.formData.currencies = of([]);
    }
  }
  private switchAddInvoiceErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.invno.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Invoice Number is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.invoiceNo');
      case 'Invoice Date is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.invoiceDate');
      case 'Invoice Expiry Date is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.invoiceExpire');
      case 'Invoice Due Date is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.dueDate');
      case 'Payment Type is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.paymentType');
      case 'Customer Id is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.customer');
      case 'Invoice Details is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.customer');
      case 'Comp ID is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.customer');
      default:
        return this.tr.translate('invoice.form.dialog.failedToCreateInvoice');
    }
  }
  private parseAddInvoiceResponse(
    result: HttpDataResponse<GeneratedInvoice | number>,
    message: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchAddInvoiceErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let sal = AppUtilities.sweetAlertSuccessMessage(
        this.tr.translate(message)
      );
      this.resetForm();
    }
  }
  private createEditForm() {
    this.generatedInvoice.subscribe((invoice) => {
      this.invno.setValue(invoice.Invoice_No ?? '');
      this.date.setValue(
        this.datePipe.transform(invoice.Invoice_Date, 'yyyy-MM-dd')
      );
      this.edate.setValue(
        this.datePipe.transform(invoice.Due_Date, 'yyyy-MM-dd')
      );
      this.iedate.setValue(
        this.datePipe.transform(invoice.Invoice_Expired_Date, 'yyyy-MM-dd')
      );
      this.ptype.setValue(invoice.Payment_Type ?? '');
      this.customerName.setValue(invoice.Chus_Name ?? '');
      this.chus.setValue(invoice.Chus_Mas_No);
      this.ccode.setValue(invoice.Currency_Code);
      this.Inv_remark.setValue(invoice.Remarks ?? '');
      this.sno.setValue(invoice.Inv_Mas_Sno);
    });
    this.appendItems();
    this.disableNeccessaryFieldsOnEdit();
  }
  private appendItems() {
    if (this.details.length > 0) {
      this.details.clear();
    }
    this.invoiceItems.subscribe((items) => {
      items.forEach((item) => {
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
    });
  }
  private disableNeccessaryFieldsOnEdit() {
    this.invno.disable();
    this.date.disable();
  }
  private switchEditInvoiceErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Invoice'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      default:
        return this.tr.translate(`invoice.noGeneratedInvoicesFound`);
    }
  }
  private assignEditInvoiceFormResponse(
    // invoice: HttpDataResponse<GeneratedInvoice>,
    // items: HttpDataResponse<GeneratedInvoice[]>
    result: HttpDataResponse<GeneratedInvoice | number>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchEditInvoiceErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let invoice = result.response as GeneratedInvoice;
      this.generatedInvoice = of(invoice);
      this.invoiceItems = of(invoice.details ?? []);
      this.createEditForm();
    }
    // if (
    //   invoice.response &&
    //   typeof invoice.response !== 'string' &&
    //   typeof invoice.response !== 'number'
    // ) {
    //   this.generatedInvoice = of(invoice.response);
    // }
    // if (
    //   items.response &&
    //   typeof items.response !== 'string' &&
    //   typeof items.response !== 'number' &&
    //   items.response.length > 0
    // ) {
    //   this.invoiceItems = of(items.response);
    // }
    // if (!this.generatedInvoice) {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`invoice.noGeneratedInvoicesFound`)
    //   );
    //   return;
    // }
    // this.createEditForm();
  }
  private getBuildPageRequests() {
    let customerNamesObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.getUserProfile().InstID,
      })
    );
    let currenciesObservable = from(this.invoiceService.getCurrencyCodes());
    let merged = zip(customerNamesObservable, currenciesObservable);
    return merged;
  }
  private requestAddInvoiceForm(body: AddInvoiceForm) {
    this.startLoading = true;
    this.invoiceService
      .addInvoice(body)
      .then((result) => {
        let message = this.generatedInvoice
          ? `invoice.form.dialog.modifiedSuccessfully`
          : `invoice.form.dialog.addedInvoiceSuccessfully`;
        this.parseAddInvoiceResponse(result, message);
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
  private getEditInvoiceFormRequests(invoiceNumber: string) {
    let invoiceDetails = from(
      this.invoiceService.invoiceDetailsById({
        compid: this.getUserProfile().InstID,
        invid: Number(invoiceNumber),
      })
    );
    let invoice = from(
      this.invoiceService.invoiceItemDetails({
        invid: Number(invoiceNumber),
      })
    );
    let merged = zip(invoiceDetails, invoice);
    return merged;
  }
  private buildEditInvoiceForm(invoiceNumber: string) {
    let compid = this.getUserProfile().InstID;
    let inv = Number(invoiceNumber);
    this.startLoading = true;
    this.invoiceService
      .findInvoice({ compid: compid, inv: inv })
      .then((result) => {
        this.assignEditInvoiceFormResponse(result);
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
    let requests = this.getBuildPageRequests();
    let res = AppUtilities.pipedObservables(requests);
    res
      .then((results) => {
        let [customers, currencies] = results;
        this.assignCustomersFormData(customers);
        this.assignCurrenciesFormData(currencies);
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
  private assignAddedCustomerToCustomerName(customer: Customer) {
    let data = {
      Cus_Mas_Sno: customer.Cust_Sno,
      Customer_Name: customer.Cust_Name,
    } as CustomerName;
    this.formData.customers.push(data);
    this.autocompleteEventListener();
  }
  ngOnInit(): void {
    this.createForm();
    this.retrieveQueryParams();
  }
  getUserProfile() {
    return this.appConfigService.getLoginResponse() as VendorLoginResponse;
  }
  ngAfterViewInit(): void {
    this.buildPage();
  }
  addInvoice() {
    if (this.generatedInvoice) {
      let form = { ...this.invoiceDetailsForm.value };
      form.invno = this.invno.value;
      form.date = new Date(this.date.value).toISOString(); //this.datePipe.transform(this.date.value, 'MM/dd/yyyy');
      form.edate = new Date(this.edate.value).toISOString(); //this.datePipe.transform(this.edate.value, 'MM/dd/yyyy');
      form.iedate = new Date(this.iedate.value).toISOString(); //this.datePipe.transform(this.iedate.value, 'MM/dd/yyyy');
      this.requestAddInvoiceForm(form);
    } else {
      this.requestAddInvoiceForm(this.invoiceDetailsForm.value);
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
  submitInvoiceDetailsForm() {
    if (this.formData.customers.length === 0) {
      this.noCustomersFound.nativeElement.showModal();
    } else if (this.invoiceDetailsForm.valid) {
      let customer = this.formData.customers.find(
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
  resetForm() {
    if (this.generatedInvoice) {
      this.retrieveQueryParams();
    } else {
      this.createForm();
    }
  }
  openCustomersDialog() {
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      disableClose: true,
    });
    dialogRef.componentInstance.addedCustomer
      .asObservable()
      .subscribe((customer) => {
        dialogRef.close();
        this.assignAddedCustomerToCustomerName(customer);
        this.customerNameInput.nativeElement.focus();
      });
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
}
