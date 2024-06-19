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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import {
  Observable,
  catchError,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  of,
  zip,
} from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { PaymentDetailsTable } from 'src/app/core/enums/vendor/reports/payment-details-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
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
    MatTableModule,
    MatSortModule,
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
  public formData: {
    companies: Company[];
    customers: CustomerName[];
    invoices: GeneratedInvoice[];
  } = {
    companies: [],
    customers: [],
    invoices: [],
  };
  public tableData: {
    payments: PaymentDetail[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<PaymentDetail>;
  } = {
    payments: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<PaymentDetail>([]),
  };
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
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
    let TABLE_SHOWING = 8;
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`paymentDetails.paymentsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(
              index === 0 ? false : index < TABLE_SHOWING,
              []
            ),
            label: this.fb.control(column.label, []),
            value: this.fb.control(column.value, []),
          });
          col.get(`included`)?.valueChanges.subscribe((included) => {
            this.resetTableColumns();
          });
          this.tableHeaders.push(col);
        });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.tableHeaders.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableData.tableColumns$ = of(this.tableData.tableColumns);
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
              this.formData.invoices = [];
            } else if (
              typeof result.response !== 'string' &&
              typeof result.response !== 'number' &&
              result.response.length > 0
            ) {
              this.formData.invoices = result.response as any;
            }
            this.startLoading = false;
            this.cdr.detectChanges();
          })
          .catch((err) => {
            this.formData.invoices = [];
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
        this.formData.invoices = [];
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
          this.formData.companies = companies.response;
        }
        if (
          customers.response &&
          typeof customers.response !== 'string' &&
          typeof customers.response !== 'number'
        ) {
          this.formData.customers = customers.response;
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: PaymentDetail,
      filter: string
    ) => {
      return data.Invoice_Sno.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Control_No &&
          data.Control_No.toLocaleLowerCase().includes(
            filter.toLocaleLowerCase()
          ))
        ? true
        : false ||
          (data.Company_Name &&
            data.Company_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false ||
          (data.Customer_Name &&
            data.Customer_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private dataSourceSortingAccessor() {
    this.tableData.dataSource.sortingDataAccessor = (
      item: any,
      property: string
    ) => {
      switch (property) {
        case 'Payment_Date':
          return new Date(item['Payment_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<PaymentDetail>(
      this.tableData.payments
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestPaymentReport(value: PaymentDetailReportForm) {
    this.tableData.payments = [];
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
          this.tableData.payments = [];
          this.prepareDataSource();
        } else if (
          typeof results.response !== 'string' &&
          typeof results.response !== 'number' &&
          results.response.length > 0
        ) {
          this.tableData.payments = results.response;
          this.prepareDataSource();
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
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
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
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Payment_Date':
      case 'Payer_Name':
      case 'Customer_Name':
      case 'Invoice_Sno':
      case 'Control_No':
      case 'Trans_Channel':
      case 'Payment_Trans_No':
      case 'Receipt_No':
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
      case 'Payment_Type':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Invoice_Sno':
        return `${style} text-black font-semibold`;
      case 'Payment_Type':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.Payment_Type,
          `Fixed`,
          `bg-purple-100`,
          `text-purple-700`,
          `bg-teal-100`,
          `text-teal-700`
        )} text-center w-fit`;
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
        return `${style} text-right`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.payments,
          element
        );
      case 'Payment_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
        return (
          PerformanceUtils.moneyFormat(element[key].toString()) +
          ' ' +
          element['Currency_Code']
        );
      case 'Control_No':
        return element['Control_No'] ? element['Control_No'] : '-';
      default:
        return element[key];
    }
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  downloadSheet() {
    if (this.tableData.payments.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.tableData.payments,
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
