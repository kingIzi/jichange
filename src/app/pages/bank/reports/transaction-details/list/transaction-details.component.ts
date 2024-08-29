import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { TransactionDetailsEditComponent } from 'src/app/components/dialogs/bank/reports/transaction-details-edit/transaction-details-edit.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { TransactionDetailsTableHeadersMap } from 'src/app/core/enums/bank/reports/transaction-details-table-headers-map';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
//import * as json from 'src/assets/temp/data.json';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { Observable, from, of, zip } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TransactionDetailsReportForm } from 'src/app/core/models/bank/forms/reports/transaction-details-report-form';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReportFormDetailsComponent } from 'src/app/components/dialogs/bank/reports/report-form-details/report-form-details.component';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { ReportFormInvoiceDetailsComponent } from '../../../../../components/dialogs/bank/reports/report-form-invoice-details/report-form-invoice-details.component';
import { InvoiceDetailsForm } from 'src/app/core/models/vendors/forms/payment-report-form';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RemoveItemDialogComponent,
    TableDateFiltersComponent,
    SuccessMessageBoxComponent,
    ReactiveFormsModule,
    TranslocoModule,
    MatDialogModule,
    RouterModule,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    MatTableExporterModule,
    MatTooltipModule,
    ReportFormDetailsComponent,
    ReportFormInvoiceDetailsComponent,
  ],
  providers: [
    DatePipe,
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
export class TransactionDetailsComponent implements OnInit {
  public headersFormGroup!: FormGroup;
  public filterTableFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
    branches: Branch[];
  } = {
    companies: [],
    customers: [],
    branches: [],
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public TransactionDetailsTableHeadersMap: typeof TransactionDetailsTableHeadersMap =
    TransactionDetailsTableHeadersMap;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('tableContainer', { static: false })
  tableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('transactionReport')
  transactionReport!: ReportFormDetailsComponent;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private tr: TranslocoService,
    private router: Router,
    private branchService: BranchService,
    private reportsService: ReportsService,
    private fileHandler: FileHandlerService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<TransactionDetail>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createRequestFormGroup() {
    this.filterTableFormGroup = this.fb.group({
      compid: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.getUserProfile().braid, [
        Validators.required,
      ]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
    if (Number(this.getUserProfile().braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.companyChangedEventHandler();
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
          .translate(`reports.overview.noVendorsFoundInBranch`)
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
          this.tr.translate(`reports.overview.noCustomersFound`)
        );
      }
      this.filterFormData.customers = [];
    }
    this.cusid.setValue('all');
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
  private createHeadersFormGroup() {
    let TABLE_SHOWING = 11;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        `transactionDetails.transactionDetailsTableBanker`,
        {},
        this.scope
      )
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
            let col = this.fb.group({
              included: this.fb.control(
                index === 0
                  ? false
                  : index < TABLE_SHOWING || index === labels.length - 1,
                []
              ),
              label: this.fb.control(column.label, []),
              value: this.fb.control(column.value, []),
            });
            col.get(`included`)?.valueChanges.subscribe((included) => {
              this.resetTableColumns();
            });
            if (index === labels.length - 1) {
              col.disable();
            }
            this.headers.push(col);
          });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this, this.tableDataService.searchTable(value);
    });
  }
  private resetTableColumns() {
    let tableColumns = this.headers.controls
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
        let [companiesList, branchList] = results;
        if (
          typeof companiesList.response !== 'number' &&
          typeof companiesList.response !== 'string'
        ) {
          this.filterFormData.companies = companiesList.response as Company[];
        }
        if (
          typeof branchList.response !== 'number' &&
          typeof branchList.response !== 'string'
        ) {
          this.filterFormData.branches = branchList.response;
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
        this.filterFormData.companies = [];
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private dataSourceFilter() {
    let filterPredicate = (data: TransactionDetail, filter: string) => {
      return data.Invoice_Sno.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      );
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
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  private parseTransactionsDataList(
    result: HttpDataResponse<string | number | TransactionDetail[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as TransactionDetail[]);
    }
  }
  private assignTransactionsDataList(
    result: HttpDataResponse<string | number | TransactionDetail[]>
  ) {
    this.parseTransactionsDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private transactionKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAYMENT_DATE)) {
      keys.push('Payment_Date');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.INVOICE_NUMBER)) {
      keys.push('Invoice_Sno');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.TOTAL_AMOUNT)) {
      keys.push('Requested_Amount');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAID_AMOUNT)) {
      keys.push('PaidAmount');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.BALANCE)) {
      keys.push('Balance');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAYMENT_METHOD)) {
      keys.push('Trans_Channel');
    }
    if (
      indexes.includes(TransactionDetailsTableHeadersMap.TRANSACTION_NUMBER)
    ) {
      keys.push('Payment_Trans_No');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.RECEIPT_NUMBER)) {
      keys.push('Receipt_No');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.transactionKeys(indexes);
  }
  private initialSubmission() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (
        params['q'] &&
        atob(params['q']).toLocaleLowerCase() ===
          'Transaction'.toLocaleLowerCase()
      ) {
        alert('Send request');
        //this.compid.setValue('all');
        //this.cusid.setValue('all');
        //this.submitForm();
      }
    });
  }
  private calculatePdfTextWidth(text: string, doc: jsPDF) {
    let width =
      (doc.getStringUnitWidth(text) * doc.getFontSize()) /
      doc.internal.scaleFactor;
    return width;
  }
  private writePdfTitleLabels(
    doc: jsPDF,
    titleText: string,
    branchText: string,
    vendorText: string,
    customerText: string,
    fromText: string,
    ToText: string
  ) {
    let pageWidth = doc.internal.pageSize.getWidth();
    let titleTextWidth = this.calculatePdfTextWidth(titleText, doc);
    let xPosition = (pageWidth - titleTextWidth) / 2;
    let titlePositionY = 10;
    doc.setFont('helvetica', 'bold');
    doc.text(titleText, xPosition, titlePositionY);

    doc.setFontSize(10);
    let branchTextWidth = this.calculatePdfTextWidth(branchText, doc);
    let branchTextXPosition = branchTextWidth;
    doc.text(branchText, branchTextXPosition, titlePositionY * 2);

    doc.setFont('helvetica', 'normal');
    if (this.branch.value === '0') {
      let branch = this.tr.translate(`defaults.any`);
      doc.text(branch, branchTextXPosition, titlePositionY * 2.5);
    } else {
      let branch = this.filterFormData.branches.find(
        (b) => b.Branch_Sno === Number(this.branch.value)
      ) as Branch;
      doc.text(branch?.Name, branchTextXPosition, titlePositionY * 2.5);
    }

    doc.setFont('helvetica', 'bold');
    let vendorTextWidth = this.calculatePdfTextWidth(vendorText, doc);
    let vendorTextXPosition = (pageWidth - vendorTextWidth) / 2;
    doc.text(vendorText, vendorTextXPosition, titlePositionY * 2);

    doc.setFont('helvetica', 'normal');
    if (this.compid.value === 'all') {
      let vendor = this.tr.translate(`defaults.any`);
      doc.text(vendor, vendorTextXPosition, titlePositionY * 2.5);
    } else {
      let vendor = this.filterFormData.companies.find(
        (c) => c.CompSno === Number(this.compid.value)
      ) as Company;
      doc.text(vendor?.CompName, vendorTextXPosition, titlePositionY * 2.5);
    }

    doc.setFont('helvetica', 'bold');
    let customerTextWidth = this.calculatePdfTextWidth(customerText, doc);
    let cutomerTextXPosition = pageWidth - customerTextWidth;
    doc.text(customerText, cutomerTextXPosition, titlePositionY * 2, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    if (this.cusid.value === 'all') {
      let vendor = this.tr.translate(`defaults.any`);
      doc.text(vendor, cutomerTextXPosition, titlePositionY * 2.5);
    } else {
      let customer = this.filterFormData.customers.find(
        (c) => c.Cust_Sno === Number(this.cusid.value)
      ) as Customer;
      doc.text(
        customer?.Cust_Name,
        cutomerTextXPosition,
        titlePositionY * 2.5,
        { align: 'right' }
      );
    }

    doc.setFont('helvetica', 'bold');
    doc.text(fromText, branchTextXPosition, titlePositionY * 3.2);
    doc.setFont('helvetica', 'normal');
    if (this.stdate.value === '') {
      doc.text('-', branchTextXPosition, titlePositionY * 3.6);
    } else {
      //let date = this.dateP;
      //doc.text();
    }

    doc.text(ToText, cutomerTextXPosition, titlePositionY * 3.2, {
      align: 'right',
    });
  }
  private getPdfHeaderLabels() {
    let branch: string =
        this.transactionReport.filterFormData.branches.find((e) => {
          return e.Sno === Number(this.transactionReport.branch.value);
        })?.Name || this.tr.translate('defaults.any'),
      vendor: string =
        this.transactionReport.filterFormData.companies.find((e) => {
          return e.CompSno === Number(this.transactionReport.Comp.value);
        })?.CompName || this.tr.translate('defaults.all'),
      customer: string =
        this.transactionReport.filterFormData.customers.find((e) => {
          return e.Cust_Sno === Number(this.transactionReport.cusid.value);
        })?.Cust_Name || this.tr.translate('defaults.any'),
      from: string = this.transactionReport.stdate.value
        ? new Date(this.transactionReport.stdate.value).toDateString()
        : 'N/A',
      to: string = this.transactionReport.enddate.value
        ? new Date(this.transactionReport.enddate.value).toDateString()
        : 'N/A';
    return [branch, vendor, customer, from, to];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    let [branch, vendor, customer, from, to] = this.getPdfHeaderLabels();

    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate(
      'reports.transactionDetails.transactionDetails'
    );
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
    let startDateLabel = `${this.tr.translate(
      'forms.from'
    )} (${this.tr.translate('reports.overview.paymentDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedLeft(
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
      this.headers,
      ['Payment_Date']
    );

    autoTable(doc, {
      body: body,
      margin: { top: endDateY2 * 1.15 },
      columns: this.tableDataService
        .getTableColumns()
        .filter((e, i) => {
          return i < this.tableDataService.getTableColumns().length - 1;
        })
        .map((c, i) => {
          return c.label;
        }),
      headStyles: {
        fillColor: '#0B6587',
        textColor: '#ffffff',
      },
    });
    doc.save(`${filename}.pdf`);
  }
  private invoiceStatusStyle(status: string) {
    if (status && status.toLocaleLowerCase() === 'awaiting payment') {
      return 'invoice-overdue';
    } else if (status && status.toLocaleLowerCase() === 'expired') {
      return 'invoice-expired';
    } else if (status && status.toLocaleLowerCase() === 'overdue') {
      return 'invoice-overdue';
    } else {
      return 'invoice-completed';
    }
  }
  ngOnInit(): void {
    this.createHeadersFormGroup();
    this.createRequestFormGroup();
    this.buildPage();
    this.initialSubmission();
  }
  requestTransactionDetailsList(
    form: TransactionDetailsReportForm | InvoiceReportForm | InvoiceDetailsForm
  ) {
    this.tableLoading = true;
    this.reportsService
      .getTransactionsReport(form)
      .then((result) => {
        this.assignTransactionsDataList(result);
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
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Payment_Date':
      case 'Invoice_Sno':
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
      case 'Control_No':
      case 'Payment_Type':
      case 'Trans_Channel':
      case 'Payment_Trans_No':
      case 'Receipt_No':
      case 'Status':
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
      case 'Action':
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
        return `${style} ${this.invoiceStatusStyle(element[key])}`;
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
        return element['Control_No'] ? element['Control_No'] : '-';
      default:
        return element[key];
    }
  }
  //open transaction chart
  openTransactionCharts() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        //headersMap: this.headersMap,
        headers: this.headers.controls.map((c) => c.get('label')?.value),
        transactions: this.tableDataService.getData(),
      },
    });
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length - 1,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'payment_details_report',
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
  downloadPdf() {
    if (this.tableDataService.getData().length > 0) {
      let table = this.tableContainer.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `payment_details_report`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  isCashAmountColumn(index: number) {
    return (
      index === TransactionDetailsTableHeadersMap.TOTAL_AMOUNT ||
      index === TransactionDetailsTableHeadersMap.PAID_AMOUNT ||
      index === TransactionDetailsTableHeadersMap.BALANCE
    );
  }
  // invoiceNumberToBase64(invoice_number: string) {
  //   return btoa(invoice_number);
  // }
  transactionsViewUrl(transaction: TransactionDetail) {
    let baseUrl = '/main/reports/transactions';
    let invoiceNumber = btoa(transaction.Invoice_Sno);
    let transactionNumber = btoa(transaction.Payment_Trans_No);
    return `${baseUrl}/${invoiceNumber}/${transactionNumber}`;
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
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
  get compid() {
    return this.filterTableFormGroup.get(`compid`) as FormControl;
  }
  get cusid() {
    return this.filterTableFormGroup.get(`cusid`) as FormControl;
  }
  get stdate() {
    return this.filterTableFormGroup.get(`stdate`) as FormControl;
  }
  get branch() {
    return this.filterTableFormGroup.get(`branch`) as FormControl;
  }
  get enddate() {
    return this.filterTableFormGroup.get(`enddate`) as FormControl;
  }
}
