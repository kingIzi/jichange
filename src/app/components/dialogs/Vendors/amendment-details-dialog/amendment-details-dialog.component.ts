import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { from, zip } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Currency } from 'src/app/core/models/vendors/currency';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { AddInvoiceForm } from 'src/app/core/models/vendors/forms/add-invoice-form';
import { AmendInvoiceForm } from 'src/app/core/models/vendors/forms/amend-invoice-form';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import {
  DateAdapter,
  MatNativeDateModule,
  NativeDateAdapter,
  NativeDateModule,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-amendment-details-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './amendment-details-dialog.component.html',
  styleUrl: './amendment-details-dialog.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  imports: [
    CommonModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    TranslocoModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NativeDateModule,
  ],
  providers: [
    DatePipe,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class AmendmentDetailsDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public invoice!: GeneratedInvoice;
  public formGroup!: FormGroup;
  public customers: CustomerName[] = [];
  public currencies: Currency[] = [];
  public invoices: GeneratedInvoice[] = [];
  public amended = new EventEmitter<GeneratedInvoice>();
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('confirmAddAmendment', { static: true })
  confirmAddAmendment!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private dialogRef: MatDialogRef<AmendmentDetailsDialogComponent>,
    private invoiceService: InvoiceService,
    private fb: FormBuilder,
    private router: Router,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      invid: number | string;
    }
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      userid: this.fb.control(this.getUserProfile().Usno, [
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
      chus: this.fb.control('', [Validators.required]),
      ccode: this.fb.control('', [Validators.required]),
      comno: this.fb.control(0, [Validators.required]),
      ctype: this.fb.control('0', [Validators.required]),
      cino: this.fb.control('0', [Validators.required]),
      twvat: this.fb.control(0, [Validators.required]),
      vtamou: this.fb.control(0, [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      lastrow: this.fb.control(0, [Validators.required]),
      Inv_remark: this.fb.control('', []),
      goods_status: this.fb.control('', []),
      total: this.fb.control('', [Validators.required]),
      details: this.fb.array([], [Validators.required]),
      reason: this.fb.control('', [Validators.required]),
    });
  }
  // private disableNeccessaryFormControls() {

  // }
  private buildPage() {
    this.startLoading = true;
    let generatedInvoiceObservable = from(
      this.invoiceService.getGeneratedInvoicebyId({
        compid: this.getUserProfile().InstID,
        invid: this.data.invid,
      })
    );
    let invoiceItemObservable = from(
      this.invoiceService.invoiceItemDetails({
        invid: Number(this.data.invid),
      })
    );
    let customerNamesObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.getUserProfile().InstID,
      })
    );
    let currenciesObservable = from(this.invoiceService.getCurrencyCodes());
    let res = AppUtilities.pipedObservables(
      zip(
        generatedInvoiceObservable,
        customerNamesObservable,
        currenciesObservable,
        invoiceItemObservable
      )
    );
    res
      .then((results) => {
        let [invoice, customers, currencies, invoiceItems] = results;
        if (
          invoice.response &&
          typeof invoice.response === 'string' &&
          invoice.response.toString().toLocaleLowerCase() ==
            'No result found'.toLocaleLowerCase()
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`generated.failedToRetrieveInvoice`)
          );
          this.startLoading = false;
          this.cdr.detectChanges();
          return;
        }
        if (
          typeof customers.response === 'string' ||
          typeof customers.response === 'number'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`generated.noCustomersFound`)
          );
          this.startLoading = false;
          this.cdr.detectChanges();
          return;
        }
        if (
          typeof currencies.response === 'string' ||
          typeof currencies.response === 'number'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`generated.noCurrenciesFound`)
          );
          this.startLoading = false;
          this.cdr.detectChanges();
          return;
        }
        if (
          typeof invoiceItems.response === 'string' ||
          typeof invoiceItems.response === 'number'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`generated.noItemsFound`)
          );
          this.startLoading = false;
          this.cdr.detectChanges();
          return;
        }
        this.invoice = invoice.response as GeneratedInvoice;
        this.customers = customers.response as CustomerName[];
        this.currencies = currencies.response as Currency[];
        this.invoices = invoiceItems.response as GeneratedInvoice[];
        this.modifyInvoiceDetailsForm();
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
  private modifyInvoiceDetailsForm() {
    this.invno.setValue(this.invoice.Invoice_No);
    this.date.setValue(
      this.invoice.Invoice_Date
        ? AppUtilities.dateToFormat(
            new Date(this.invoice.Invoice_Date),
            'yyyy-MM-dd'
          )
        : ''
    );
    this.edate.setValue(
      this.invoice.Due_Date
        ? AppUtilities.dateToFormat(
            new Date(this.invoice.Due_Date),
            'yyyy-MM-dd'
          )
        : ''
    );
    this.iedate.setValue(
      this.invoice.Invoice_Expired_Date
        ? AppUtilities.dateToFormat(
            new Date(this.invoice.Invoice_Expired_Date),
            'yyyy-MM-dd'
          )
        : ''
    );
    this.ptype.setValue(
      this.invoice.Payment_Type ? this.invoice.Payment_Type : ''
    );
    this.chus.setValue(this.invoice.Chus_Mas_No);
    this.goods_status.setValue(this.invoice.goods_status);
    this.ccode.setValue(this.invoice.Currency_Code);
    this.Inv_remark.setValue(
      this.invoice.Remarks ? this.invoice.Remarks.trim() : ''
    );
    this.sno.setValue(this.invoice.Inv_Mas_Sno);
    this.reason.setValue(this.invoice.Reason);
    this.appendItems();
    this.disableFormFields();
  }
  private disableFormFields() {
    this.invno.disable();
    this.date.disable();
    this.chus.disable();
    this.ccode.disable();
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
  private switchAmendInvoiceResponse(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.invno.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Invoice Number is missing'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.invoiceNumber');
      case 'Invoice Date is missing'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.invoiceDate');
      case 'Invoice Expiry Date is missing'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.expiryDate');
      case 'Invoice Due Date is missing'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.dueDate');
      case 'Payment Type is missing'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.paymentType');
      case 'Invoice Details is missing'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.details');
      case 'Missing Reason'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.reason');
      case 'Modify items for amendments'.toLocaleLowerCase():
        return this.tr.translate('generated.form.dialog.modifyItems');
      default:
        return this.tr.translate(`generated.failedToRetrieveAmendedInvoice`);
    }
  }
  private parseAmendInvoiceResponse(
    result: HttpDataResponse<number | GeneratedInvoice>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchAmendInvoiceResponse(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      // let sal = AppUtilities.sweetAlertSuccessMessage(
      //   this.tr.translate(`generated.invoiceAmendedSuccessfully`)
      // );
      //let message = this.tr.translate(`generated.invoiceAmendedSuccessfully`);
      this.amended.emit(result.response as GeneratedInvoice);
    }
  }
  private requestAmendInvoice(body: AmendInvoiceForm) {
    this.startLoading = true;
    this.invoiceService
      .addAmendment(body)
      .then((result) => {
        // if (typeof result.response === 'number' && result.response > 0) {
        //   let sal = AppUtilities.sweetAlertSuccessMessage(
        //     this.tr.translate(`generated.invoiceAmendedSuccessfully`)
        //   );
        //   this.amended.emit();
        // } else {
        //   AppUtilities.openDisplayMessageBox(
        //     this.displayMessageBox,
        //     this.tr.translate(`defaults.failed`),
        //     this.tr.translate(`generated.failedToRetrieveAmendedInvoice`)
        //   );
        // }
        this.parseAmendInvoiceResponse(result);
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
  ngOnInit(): void {
    this.createFormGroup();
    this.buildPage();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  closeDialog() {
    this.dialogRef.close();
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
    this.total.setValue(sumAmount.toFixed(2));
    this.auname.setValue(sumAmount.toFixed(2));
    return moneyFormat;
  }
  submitInvoiceDetailsForm() {
    if (this.formGroup.valid) {
      this.confirmAddAmendment.nativeElement.showModal();
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  addAmendment() {
    let form = { ...this.formGroup.value };
    form.invno = this.invno.value;
    form.chus = this.chus.value;
    form.ccode = this.ccode.value;
    form.date = new Date(this.date.value).toISOString(); //this.datePipe.transform(this.date.value, 'MM/dd/yyyy');
    form.edate = new Date(this.edate.value).toISOString(); //this.datePipe.transform(this.edate.value, 'MM/dd/yyyy');
    form.iedate = new Date(this.iedate.value).toISOString(); //this.datePipe.transform(this.iedate.value, 'MM/dd/yyyy');
    //this.chus.disable();
    //this.ccode.disable();
    this.requestAmendInvoice(form);
  }
  get invno() {
    return this.formGroup.get('invno') as FormControl;
  }
  get date() {
    return this.formGroup.get('date') as FormControl;
  }
  get edate() {
    return this.formGroup.get('edate') as FormControl;
  }
  get iedate() {
    return this.formGroup.get('iedate') as FormControl;
  }
  get ptype() {
    return this.formGroup.get('ptype') as FormControl;
  }
  get chus() {
    return this.formGroup.get('chus') as FormControl;
  }
  get ccode() {
    return this.formGroup.get('ccode') as FormControl;
  }
  get Inv_remark() {
    return this.formGroup.get('Inv_remark') as FormControl;
  }
  get total() {
    return this.formGroup.get('total') as FormControl;
  }
  get auname() {
    return this.formGroup.get('auname') as FormControl;
  }
  get details() {
    return this.formGroup.get('details') as FormArray;
  }
  get company() {
    return this.formGroup.get('company') as FormControl;
  }
  get sno() {
    return this.formGroup.get('sno') as FormControl;
  }
  get goods_status() {
    return this.formGroup.get('goods_status') as FormControl;
  }
  get reason() {
    return this.formGroup.get(`reason`) as FormControl;
  }
}
