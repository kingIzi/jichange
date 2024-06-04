import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import {
  catchError,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  zip,
} from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { PaymentDetailsTable } from 'src/app/core/enums/vendor/reports/payment-details-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { PaymentDetailReportForm } from 'src/app/core/models/vendors/forms/payment-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { PaymentDetail } from 'src/app/core/models/vendors/payment-detail';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    MatPaginatorModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class PaymentDetailsComponent implements OnInit {
  public tableFormGroup!: FormGroup;
  public filterFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public companies: Company[] = [];
  public customers: CustomerName[] = [];
  public invoices: GeneratedInvoice[] = [];
  public payments: PaymentDetail[] = [];
  public paymentsData: PaymentDetail[] = [];
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public PaymentDetailsTable: typeof PaymentDetailsTable = PaymentDetailsTable;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private invoiceService: InvoiceService,
    private reportService: ReportsService,
    private paymentService: PaymentsService,
    private fileHandler: FileHandlerService,
    private invoiceReportService: InvoiceReportServiceService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createFilterForm() {
    this.filterFormGroup = this.fb.group({
      compid: this.fb.control(this.userProfile.InstID, [Validators.required]),
      cust: this.fb.control('', [Validators.required]),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
      invno: this.fb.control('', [Validators.required]),
    });
    this.compid.disable();
    this.customerChanged();
  }
  private async createHeaderGroup() {
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `paymentDetails.paymentsTable`,
      this.scope,
      this.tableHeaders,
      this.fb,
      this,
      7,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case PaymentDetailsTable.DATE:
        this.payments.sort((a, b) =>
          new Date(a.Payment_Date) > new Date(b.Payment_Date) ? 1 : -1
        );
        break;
      case PaymentDetailsTable.PAYER:
        this.payments.sort((a, b) => (a.Payer_Name > b.Payer_Name ? 1 : -1));
        break;
      case PaymentDetailsTable.CUSTOMER:
        this.payments.sort((a, b) =>
          a.Customer_Name > b.Customer_Name ? 1 : -1
        );
        break;
      case PaymentDetailsTable.INVOICE_NUMBER:
        this.payments.sort((a, b) => (a.Invoice_Sno > b.Invoice_Sno ? 1 : -1));
        break;
      case PaymentDetailsTable.CONTROL_NUMBER:
        this.payments.sort((a, b) => (a.Control_No > b.Control_No ? 1 : -1));
        break;
      case PaymentDetailsTable.CHANNEL:
        this.payments.sort((a, b) =>
          a.Trans_Channel > b.Trans_Channel ? 1 : -1
        );
        break;
      case PaymentDetailsTable.TRANSACTION_NUMBER:
        this.payments.sort((a, b) =>
          a.Payment_Trans_No > b.Payment_Trans_No ? 1 : -1
        );
        break;
      case PaymentDetailsTable.RECEIPT_NUMBER:
        this.payments.sort((a, b) => (a.Receipt_No > b.Receipt_No ? 1 : -1));
        break;
      case PaymentDetailsTable.PAID_AMOUNT:
        this.payments.sort((a, b) => (a.PaidAmount > b.PaidAmount ? 1 : -1));
        break;
      case PaymentDetailsTable.BALANCE:
        this.payments.sort((a, b) => (a.Balance > b.Balance ? 1 : -1));
        break;
      case PaymentDetailsTable.TOTAL_AMOUNT:
        this.payments.sort((a, b) =>
          a.Requested_Amount > b.Requested_Amount ? 1 : -1
        );
        break;
      case PaymentDetailsTable.PAYMENT_TYPE:
        this.payments.sort((a, b) =>
          a.Payment_Type > b.Payment_Type ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case PaymentDetailsTable.DATE:
        this.payments.sort((a, b) =>
          new Date(a.Payment_Date) < new Date(b.Payment_Date) ? 1 : -1
        );
        break;
      case PaymentDetailsTable.PAYER:
        this.payments.sort((a, b) => (a.Payer_Name < b.Payer_Name ? 1 : -1));
        break;
      case PaymentDetailsTable.CUSTOMER:
        this.payments.sort((a, b) =>
          a.Customer_Name < b.Customer_Name ? 1 : -1
        );
        break;
      case PaymentDetailsTable.INVOICE_NUMBER:
        this.payments.sort((a, b) => (a.Invoice_Sno < b.Invoice_Sno ? 1 : -1));
        break;
      case PaymentDetailsTable.CONTROL_NUMBER:
        this.payments.sort((a, b) => (a.Control_No < b.Control_No ? 1 : -1));
        break;
      case PaymentDetailsTable.CHANNEL:
        this.payments.sort((a, b) =>
          a.Trans_Channel < b.Trans_Channel ? 1 : -1
        );
        break;
      case PaymentDetailsTable.TRANSACTION_NUMBER:
        this.payments.sort((a, b) =>
          a.Payment_Trans_No < b.Payment_Trans_No ? 1 : -1
        );
        break;
      case PaymentDetailsTable.RECEIPT_NUMBER:
        this.payments.sort((a, b) => (a.Receipt_No < b.Receipt_No ? 1 : -1));
        break;
      case PaymentDetailsTable.PAID_AMOUNT:
        this.payments.sort((a, b) => (a.PaidAmount < b.PaidAmount ? 1 : -1));
        break;
      case PaymentDetailsTable.BALANCE:
        this.payments.sort((a, b) => (a.Balance < b.Balance ? 1 : -1));
        break;
      case PaymentDetailsTable.TOTAL_AMOUNT:
        this.payments.sort((a, b) =>
          a.Requested_Amount < b.Requested_Amount ? 1 : -1
        );
        break;
      case PaymentDetailsTable.PAYMENT_TYPE:
        this.payments.sort((a, b) =>
          a.Payment_Type < b.Payment_Type ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.cust.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
      );
    }
    if (this.invno.valid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.invoiceNo`)
      );
    }
    if (this.stdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.startDate`)
      );
    }
    if (this.enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.endDate`)
      );
    }
  }
  private customerChanged() {
    this.cust.valueChanges.subscribe((value) => {
      if (value !== 'all') {
        let form = {
          Comp: this.userProfile.InstID,
          cusid: value,
          stdate: '',
          enddate: '',
        } as InvoiceReportForm;
        this.startLoading = true;
        this.invoiceReportService
          .getInvoiceReport(form)
          .then((result) => {
            if (
              typeof result.response !== 'string' &&
              typeof result.response !== 'number' &&
              result.response.length == 0
            ) {
              AppUtilities.openDisplayMessageBox(
                this.displayMessageBox,
                this.tr.translate(`defaults.failed`),
                this.tr.translate(`reports.invoiceDetails.noInvoicesFound`)
              );
              this.invoices = [];
            } else if (
              typeof result.response !== 'string' &&
              typeof result.response !== 'number' &&
              result.response.length > 0
            ) {
              this.invoices = result.response as any;
            }
            this.startLoading = false;
            this.cdr.detectChanges();
          })
          .catch((err) => {
            this.invoices = [];
            AppUtilities.requestFailedCatchError(
              err,
              this.displayMessageBox,
              this.tr
            );
            this.startLoading = false;
            this.cdr.detectChanges();
            throw err;
          });
      } else {
        this.invoices = [];
      }
    });
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObservable = from(this.reportService.getCompaniesList({}));
    let customersObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.userProfile.InstID,
      })
    );
    let mergedObservable = zip(companiesObservable, customersObservable);
    let res = AppUtilities.pipedObservables(mergedObservable)
      .then((results) => {
        let [companies, customers] = results;
        if (
          companies.response &&
          typeof companies.response !== 'string' &&
          typeof companies.response !== 'number'
        ) {
          this.companies = companies.response;
        }
        if (
          customers.response &&
          typeof customers.response !== 'string' &&
          typeof customers.response !== 'number'
        ) {
          this.customers = customers.response;
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
  private requestPaymentReport(value: PaymentDetailReportForm) {
    this.paymentsData = [];
    this.payments = this.paymentsData;
    this.tableLoading = true;
    this.paymentService
      .getPaymentReport(value)
      .then((results) => {
        if (
          typeof results.response !== 'string' &&
          typeof results.response !== 'number' &&
          results.response.length == 0
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
        } else if (
          typeof results.response !== 'string' &&
          typeof results.response !== 'number' &&
          results.response.length > 0
        ) {
          this.paymentsData = results.response;
          this.payments = this.paymentsData;
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${date}/${month}/${year}`;
  }
  private paymentKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(PaymentDetailsTable.DATE)) {
      keys.push('Payment_Date');
    }
    if (indexes.includes(PaymentDetailsTable.PAYER)) {
      keys.push('Payer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.CUSTOMER)) {
      keys.push('Customer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.INVOICE_NUMBER)) {
      keys.push('Invoice_Sno');
    }
    if (indexes.includes(PaymentDetailsTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(PaymentDetailsTable.CHANNEL)) {
      keys.push('Trans_Channel');
    }
    if (indexes.includes(PaymentDetailsTable.TRANSACTION_NUMBER)) {
      keys.push('Payment_Trans_No');
    }
    if (indexes.includes(PaymentDetailsTable.RECEIPT_NUMBER)) {
      keys.push('Receipt_No');
    }
    if (indexes.includes(PaymentDetailsTable.PAID_AMOUNT)) {
      keys.push('PaidAmount');
    }
    if (indexes.includes(PaymentDetailsTable.BALANCE)) {
      keys.push('Balance');
    }
    if (indexes.includes(PaymentDetailsTable.TOTAL_AMOUNT)) {
      keys.push('Requested_Amount');
    }
    if (indexes.includes(PaymentDetailsTable.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.tableHeaders.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.paymentKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      let keys = this.getActiveTableKeys();
      this.payments = this.paymentsData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.payments = this.paymentsData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createFilterForm();
    this.createHeaderGroup();
    this.buildPage();
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  isCashAmountColumn(index: number) {
    return (
      index === PaymentDetailsTable.TOTAL_AMOUNT ||
      PaymentDetailsTable.BALANCE ||
      PaymentDetailsTable.PAID_AMOUNT
    );
  }
  downloadSheet() {
    if (this.paymentsData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.paymentsData,
        this.getActiveTableKeys(),
        'payments_report',
        ['Payment_Date']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
      let form = { ...this.filterFormGroup.value };
      form.compid = this.userProfile.InstID;
      form.stdate = this.reformatDate(
        this.filterFormGroup.value.stdate.split('-')
      );
      form.enddate = this.reformatDate(
        this.filterFormGroup.value.enddate.split('-')
      );
      this.requestPaymentReport(form);
    } else {
      this.filterFormGroup.markAllAsTouched();
    }
  }
  get compid() {
    return this.filterFormGroup.get('compid') as FormControl;
  }
  get cust() {
    return this.filterFormGroup.get('cust') as FormControl;
  }
  get stdate() {
    return this.filterFormGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterFormGroup.get('enddate') as FormControl;
  }
  get invno() {
    return this.filterFormGroup.get('invno') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
