import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TransactionDetailsTableHeadersMap } from 'src/app/core/enums/bank/reports/transaction-details-table-headers-map';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
//import { LoginResponse } from 'src/app/core/models/login-response';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { Observable, from, of, zip } from 'rxjs';
import { TransactionDetailsReportForm } from 'src/app/core/models/bank/forms/reports/transaction-details-report-form';
import { RouterLink } from '@angular/router';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { ReportFormDetailsComponent } from 'src/app/components/dialogs/bank/reports/report-form-details/report-form-details.component';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import {
  MatTableExporterModule,
  ExportType,
  MatTableExporterDirective,
} from 'mat-table-exporter';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    TableDateFiltersComponent,
    ReactiveFormsModule,
    NgxLoadingModule,
    SuccessMessageBoxComponent,
    TranslocoModule,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReportFormDetailsComponent,
    MatTableExporterModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class ListComponent implements OnInit {
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  // public tableData: {
  //   transactions: TransactionDetail[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<TransactionDetail>;
  // } = {
  //   transactions: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<TransactionDetail>([]),
  // };
  public headersFormGroup!: FormGroup;
  public filterTableFormGroup!: FormGroup;
  //public userProfile!: LoginResponse;
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
  } = {
    companies: [],
    customers: [],
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

  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<TransactionDetail>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersFormGroup() {
    let TABLE_SHOWING = 10;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        `transactionDetails.transactionDetailsTable`,
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
      this.tableDataService.searchTable(value);
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
  private createRequestFormGroup() {
    this.filterTableFormGroup = this.fb.group({
      compid: this.fb.control(this.getUserProfile().InstID, [
        Validators.required,
      ]),
      cusid: this.fb.control('', [Validators.required]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    if (this.getUserProfile().InstID > 0) {
      this.compid.disable();
    }
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
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(this.reportsService.getCompaniesList({}));
    let customersObs = from(
      this.reportsService.getCustomerDetailsList({
        Sno: this.getUserProfile().InstID,
      })
    );
    let res = AppUtilities.pipedObservables(zip(companiesObs, customersObs));
    res
      .then((results) => {
        let [companiesList, customerList] = results;
        if (
          typeof companiesList.response !== 'number' &&
          typeof companiesList.response !== 'string'
        ) {
          this.filterFormData.companies = companiesList.response as Company[];
        }
        if (
          typeof customerList.response !== 'number' &&
          typeof customerList.response !== 'string'
        ) {
          this.filterFormData.customers = customerList.response as Customer[];
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
        this.filterFormData.customers = [];
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
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<TransactionDetail>(
  //     this.tableData.transactions
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private initialFormSubmission() {
    this.cusid.setValue('all');
    let form = { ...this.filterTableFormGroup.value };
    form.compid = this.getUserProfile().InstID;
    if (form.stdate) {
      form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
    }
    if (form.enddate) {
      form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
    }
    this.requestTransactionDetailsList(form);
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
  private assignTransactionsList(
    result: HttpDataResponse<string | number | TransactionDetail[]>
  ) {
    this.parseTransactionsDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    let titleText = this.tr.translate(
      'reports.transactionDetails.transactionDetails'
    );
    let doc = new jsPDF();
    doc.text(titleText, 13, 15);
    autoTable(doc, {
      html: table,
      margin: { top: 20 },
      // columns: this.tableDataService.getTableColumns().map((t,index) => {
      //   return t.label;
      // }),
      columns: this.headers.controls
        .filter(
          (h) => h.get('included')?.value && h.get('value')?.value !== 'Action'
        )
        .map((h) => h.get('label')?.value),
      headStyles: {
        fillColor: '#8196FE',
        textColor: '#000000',
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
    this.createRequestFormGroup();
    this.createHeadersFormGroup();
    //this.buildPage();
    //this.initialFormSubmission();
  }
  requestTransactionDetailsList(
    form: TransactionDetailsReportForm | InvoiceReportForm
  ) {
    this.tableLoading = true;
    this.reportsService
      .getTransactionsReport(form)
      .then((result) => {
        // if (
        //   typeof result.response !== 'number' &&
        //   typeof result.response !== 'string'
        // ) {
        //   this.tableData.transactions = result.response;
        //   this.prepareDataSource();
        // } else {
        //   AppUtilities.openDisplayMessageBox(
        //     this.displayMessageBox,
        //     this.tr.translate(`defaults.warning`),
        //     this.tr.translate(`errors.noDataFound`)
        //   );
        //   this.tableData.transactions = [];
        //   this.prepareDataSource();
        // }
        this.assignTransactionsList(result);
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
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
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
  isCashAmountColumn(index: number) {
    return (
      index === TransactionDetailsTableHeadersMap.TOTAL_AMOUNT ||
      index === TransactionDetailsTableHeadersMap.PAID_AMOUNT ||
      index === TransactionDetailsTableHeadersMap.BALANCE
    );
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length - 1,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'transactions_details_report',
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
      this.parsePdf(table as HTMLTableElement, `transactions_details_report`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  invoiceNumberToBase64(invoice_number: string) {
    return btoa(invoice_number);
  }
  transactionsViewUrl(transaction: TransactionDetail) {
    let baseUrl = '/vendor/reports/transactions';
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
  get enddate() {
    return this.filterTableFormGroup.get(`enddate`) as FormControl;
  }
}
