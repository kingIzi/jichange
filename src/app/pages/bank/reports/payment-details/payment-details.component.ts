import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NO_ERRORS_SCHEMA,
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
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { Observable, firstValueFrom, from, of, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { PaymentDetailsTable } from 'src/app/core/enums/bank/reports/payment-details-table';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import {
  InvoiceReportForm,
  InvoiceReportFormBanker,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { PaymentDetail } from 'src/app/core/models/vendors/payment-detail';
import {
  InvoiceDetailsForm,
  PaymentDetailReportForm,
} from 'src/app/core/models/vendors/forms/payment-report-form';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportFormInvoiceDetailsComponent } from '../../../../components/dialogs/bank/reports/report-form-invoice-details/report-form-invoice-details.component';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import tailwindcss from 'tailwindcss';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    SuccessMessageBoxComponent,
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    ReportFormInvoiceDetailsComponent,
    MatTableExporterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
    {
      provide: TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class PaymentDetailsComponent implements OnInit {
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
    invoiceReports: InvoiceReport[];
    branches: Branch[];
  } = {
    companies: [],
    customers: [],
    invoiceReports: [],
    branches: [],
  };
  // public tableData: {
  //   payments: PaymentDetail[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<PaymentDetail>;
  // } = {
  //   payments: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<PaymentDetail>([]),
  // };
  public filterForm!: FormGroup;
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public PaymentDetailsTable: typeof PaymentDetailsTable = PaymentDetailsTable;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('paymentDetailsTable')
  paymentDetailsTable!: ElementRef<HTMLDivElement>;
  @ViewChild('reportFormInvoiceDetails')
  reportFormInvoiceDetails!: ReportFormInvoiceDetailsComponent;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private branchService: BranchService,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private paymentService: PaymentsService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<PaymentDetail>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.compid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.company`)
      );
    }
    if (this.cusid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
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
  private createFilterForm() {
    this.filterForm = this.fb.group({
      compid: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.getUserProfile().braid, [
        Validators.required,
      ]),
      invno: this.fb.control('', []),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
    if (Number(this.getUserProfile().braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.companyChangedEventHandler();
    this.filterFormChanged();
  }
  private branchChangedEventHandler() {
    this.branch.valueChanges.subscribe((value) => {
      this.requestCompaniesList({ branch: value });
    });
  }
  private companyChangedEventHandler() {
    this.compid.valueChanges.subscribe((value) => {
      this.requestCustomersList({ Sno: value });
    });
  }
  private filterFormChanged() {
    this.filterForm.valueChanges.subscribe((value) => {
      if (value.compid && value.cusid) {
        let form = {
          branch: this.getUserProfile().braid,
          Comp: value.compid,
          cusid: value.cusid,
          stdate: '',
          enddate: '',
        } as InvoiceReportFormBanker;
        this.requestInvoicesList(form);
      }
    });
  }
  private assignCompaniesFilterData(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'number' &&
      typeof result.response !== 'string'
    ) {
      this.filterFormData.companies = result.response;
    } else {
      this.filterFormData.companies = [];
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr
          .translate(`reports.customerDetailReport.noVendorsFoundInBranch`)
          .replace(
            '{}',
            this.filterFormData.branches.find(
              (b) => b.Branch_Sno.toString() === this.branch.value
            )?.Name as string
          )
      );
    }
    this.compid.setValue('all');
  }
  private assignCustomersFilterData(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'number' &&
      typeof result.response !== 'string'
    ) {
      this.filterFormData.customers = result.response;
    } else {
      if (this.compid.value !== 'all') {
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          this.tr.translate(
            `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
          )
        );
      }
      this.filterFormData.customers = [];
    }
    this.cusid.setValue('all');
  }
  private noInvoiceFoundWarningMessage() {
    let customer = this.filterFormData.customers.find(
      (elem) => elem.Cust_Sno === Number(this.cusid.value)
    );
    if (customer) {
      let message = this.tr
        .translate(`reports.amendmentDetails.noInvoicesFound`)
        .replace('{}', customer.Cust_Name);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        message
      );
    }
  }
  private assignInvoiceListFilterData(
    result: HttpDataResponse<string | number | InvoiceReport[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.filterFormData.invoiceReports = result.response;
    } else {
      this.noInvoiceFoundWarningMessage();
      this.filterFormData.invoiceReports = [];
    }
    //this.invno.setValue('all');
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.startLoading = true;
    this.reportsService
      .getBranchedCompanyList(body)
      .then((result) => {
        this.assignCompaniesFilterData(result);
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
  private requestCustomersList(body: { Sno: number | string }) {
    this.startLoading = true;
    this.reportsService
      .getCustomerDetailsList(body)
      .then((result) => {
        this.assignCustomersFilterData(result);
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.filterFormData.customers = [];
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private requestInvoicesList(body: InvoiceReportFormBanker) {
    this.startLoading = true;
    this.invoiceReportService
      .getInvoiceReport(body)
      .then((result) => {
        this.assignInvoiceListFilterData(result);
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
  private async createHeaderGroup() {
    let TABLE_SHOWING = 10;
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`paymentDetails.paymentsTableBanker`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
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
      this.tableDataService.searchTable(value);
    });
  }
  private resetTableColumns() {
    let tableColumns = this.tableHeaders.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableDataService.setTableColumns(tableColumns);
    this.tableDataService.setTableColumnsObservable(tableColumns);
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private paymentKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(PaymentDetailsTable.PAYMENT_DATE)) {
      keys.push('Payment_Date');
    }
    if (indexes.includes(PaymentDetailsTable.INVOICE_NUMBER)) {
      keys.push('Invoice_Sno');
    }
    if (indexes.includes(PaymentDetailsTable.TRANSACTION_NUMBER)) {
      keys.push('Payment_Trans_No');
    }
    if (indexes.includes(PaymentDetailsTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(PaymentDetailsTable.CHANNEL)) {
      keys.push('Trans_Channel');
    }
    if (indexes.includes(PaymentDetailsTable.RECEIPT_NUMBER)) {
      keys.push('Receipt_No');
    }
    if (indexes.includes(PaymentDetailsTable.AMOUNT)) {
      keys.push('PaidAmount');
    }
    if (indexes.includes(PaymentDetailsTable.BALANCE)) {
      keys.push('Balance');
    }
    if (indexes.includes(PaymentDetailsTable.FROM)) {
      keys.push('Payer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.TO)) {
      keys.push('Customer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.FOR)) {
      keys.push('Payment_Desc');
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
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
  private assignBranchList(
    result: HttpDataResponse<string | number | Branch[]>
  ) {
    if (
      typeof result.response !== 'number' &&
      typeof result.response !== 'string'
    ) {
      this.filterFormData.branches = result.response;
      this.startLoading = false;
    }
  }
  private assignTableDataCompanies(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    if (
      typeof result.response !== 'number' &&
      typeof result.response !== 'string'
    ) {
      this.filterFormData.companies = result.response as Company[];
      this.startLoading = false;
    }
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.getUserProfile().braid,
      })
    );
    let branchObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(companiesObs, branchObs));
    res
      .then((results) => {
        let [companies, branchList] = results;
        this.assignTableDataCompanies(companies);
        this.assignBranchList(branchList);
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.filterFormData.companies = [];
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
    let filterPredicate = (data: PaymentDetail, filter: string) => {
      return data.Invoice_Sno.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Control_No &&
          data.Control_No.toLocaleLowerCase().includes(
            filter.toLocaleLowerCase()
          ))
        ? true
        : false ||
          (data.Payer_Name &&
            data.Payer_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Payment_Date':
          return new Date(item['Payment_Date']);
        default:
          return item[property];
      }
    };
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<PaymentDetail>(
  //     this.tableData.payments
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private parsePaymentDataList(
    result: HttpDataResponse<string | number | PaymentDetail[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as PaymentDetail[]);
    }
  }
  private assignPaymentsDataList(
    result: HttpDataResponse<string | number | PaymentDetail[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.payments = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.paymentDetails.noPaymentsFound`)
    //   );
    //   this.tableData.payments = [];
    // }
    // this.prepareDataSource();
    this.parsePaymentDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private getPdfHeaderLabels() {
    let branch: string =
        this.reportFormInvoiceDetails.filterFormData.branches.find((e) => {
          return e.Sno === Number(this.reportFormInvoiceDetails.branch.value);
        })?.Name || this.tr.translate('defaults.any'),
      vendor: string =
        this.reportFormInvoiceDetails.filterFormData.companies.find((e) => {
          return e.CompSno === Number(this.reportFormInvoiceDetails.Comp.value);
        })?.CompName || this.tr.translate('defaults.all'),
      customer: string =
        this.reportFormInvoiceDetails.filterFormData.customers.find((e) => {
          return (
            e.Cust_Sno === Number(this.reportFormInvoiceDetails.cusid.value)
          );
        })?.Cust_Name || this.tr.translate('defaults.any'),
      invoice: string =
        this.reportFormInvoiceDetails.filterFormData.invoiceReports.find(
          (e) => {
            return (
              e.Inv_Mas_Sno ===
              Number(this.reportFormInvoiceDetails.invno.value)
            );
          }
        )?.Invoice_No || this.tr.translate('defaults.any'),
      from: string = this.reportFormInvoiceDetails.stdate.value
        ? new Date(this.reportFormInvoiceDetails.stdate.value).toDateString()
        : 'N/A',
      to: string = this.reportFormInvoiceDetails.enddate.value
        ? new Date(this.reportFormInvoiceDetails.enddate.value).toDateString()
        : 'N/A';
    return [branch, vendor, customer, invoice, from, to];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    let [branch, vendor, customer, invoice, from, to] =
      this.getPdfHeaderLabels();
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('reports.paymentDetails.payment');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let [branchY1, branchY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      this.tr.translate('forms.branch'),
      branch,
      titlePositionY * 2
    );
    let [vendorY1, vendorY2] = TableUtilities.writePdfTextAlignedCenter(
      doc,
      this.tr.translate('forms.vendor'),
      vendor,
      titlePositionY * 2
    );
    let [customerY1, customerY2] = TableUtilities.writePdfTextAlignedRight(
      doc,
      this.tr.translate('forms.customer'),
      customer,
      titlePositionY * 2
    );
    let [invoiceY1, invoiceY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      this.tr.translate('forms.invoiceNumber'),
      invoice,
      branchY2 * 1.25
    );
    let startDateLabel = `${this.tr.translate(
      'forms.from'
    )} (${this.tr.translate('reports.overview.paymentDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedCenter(
      doc,
      startDateLabel,
      from,
      branchY2 * 1.25
    );
    let endDateLabel = `${this.tr.translate('forms.to')} (${this.tr.translate(
      'reports.overview.paymentDate'
    )})`;
    let [endDateY1, endDateY2] = TableUtilities.writePdfTextAlignedRight(
      doc,
      endDateLabel,
      to,
      branchY2 * 1.25
    );
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.tableHeaders,
      ['Payment_Date']
    );
    autoTable(doc, {
      body: body,
      margin: { top: endDateY2 * 1.15 },
      columns: this.tableDataService.getTableColumns().map((c) => {
        return c.label;
      }),
      headStyles: {
        fillColor: '#0B6587',
        textColor: '#ffffff',
      },
    });
    doc.save(`${filename}.pdf`);
  }
  private deliveryStatusStyle(status: string) {
    if (status) {
      return `${PerformanceUtils.getActiveStatusStyles(
        status,
        'Delivered',
        'bg-green-100',
        'text-green-700',
        'bg-orange-100',
        'text-orange-700'
      )} text-center w-fit`;
    } else {
      return 'delivery-status';
    }
  }
  ngOnInit(): void {
    this.createFilterForm();
    this.createHeaderGroup();
    //this.buildPage();
  }
  requestPaymentReport(
    value: PaymentDetailReportForm | InvoiceDetailsForm | InvoiceReportForm
  ) {
    this.tableLoading = true;
    this.paymentService
      .getPaymentReport(value)
      .then((result) => {
        this.assignPaymentsDataList(result);
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
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  submitFilterForm() {
    if (this.filterForm.valid) {
      let form = { ...this.filterForm.value };
      if (form.stdate) {
        form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
      }
      if (form.enddate) {
        form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
      }
      form.branch = this.branch.value;
      this.requestPaymentReport(form);
    } else {
      this.filterForm.markAllAsTouched();
    }
  }
  isCashAmountColumn(index: number) {
    return (
      index == PaymentDetailsTable.AMOUNT ||
      index == PaymentDetailsTable.BALANCE
    );
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
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
      case 'Company_Name':
      case 'Payment_Desc':
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
      case 'Status':
        return `${style} ${this.deliveryStatusStyle(element[key])}`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableDataService.getData(),
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
      case 'Company_Name':
      case 'Payment_Desc':
        return element[key] ? element[key] : '-';
      case 'Status':
        return element[key] ? element[key] : 'Not sent';

      default:
        return element[key];
    }
  }
  downloadPdf() {
    if (this.tableDataService.getData().length > 0) {
      let table = this.paymentDetailsTable.nativeElement.querySelector('table');
      this.parsePdf(
        table as HTMLTableElement,
        `completed_payment_details_Report`
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'completed_payment_details_Report',
        Props: {
          Author: 'Biz logic solutions',
        },
      });
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  getTableDataSource() {
    return this.tableDataService.getDataSource();
  }
  getTableDataList() {
    return this.tableDataService.getData();
  }
  getTableDataColumns() {
    return this.tableDataService.getTableColumns();
  }
  geTableDataColumnsObservable() {
    return this.tableDataService.getTableColumnsObservable();
  }
  get compid() {
    return this.filterForm.get('compid') as FormControl;
  }
  get cusid() {
    return this.filterForm.get('cusid') as FormControl;
  }
  get invno() {
    return this.filterForm.get('invno') as FormControl;
  }
  get branch() {
    return this.filterForm.get('branch') as FormControl;
  }
  get stdate() {
    return this.filterForm.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterForm.get('enddate') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
