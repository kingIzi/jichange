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
import { LoginResponse } from 'src/app/core/models/login-response';
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
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class ListComponent implements OnInit {
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public tableData: {
    transactions: TransactionDetail[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<TransactionDetail>;
  } = {
    transactions: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<TransactionDetail>([]),
  };
  public headersFormGroup!: FormGroup;
  public filterTableFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
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
  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createHeadersFormGroup() {
    let TABLE_SHOWING = 7;
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
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
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
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.headers.controls
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
  private createRequestFormGroup() {
    this.filterTableFormGroup = this.fb.group({
      compid: this.fb.control(this.userProfile.InstID, [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    if (this.userProfile.InstID > 0) {
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(this.reportsService.getCompaniesList({}));
    let customersObs = from(
      this.reportsService.getCustomerDetailsList({
        Sno: this.userProfile.InstID,
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
    this.tableData.dataSource.filterPredicate = (
      data: TransactionDetail,
      filter: string
    ) => {
      return data.Invoice_Sno.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      );
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
    this.tableData.dataSource = new MatTableDataSource<TransactionDetail>(
      this.tableData.transactions
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestTransactionDetailsList(form: TransactionDetailsReportForm) {
    this.tableData.transactions = [];
    this.prepareDataSource();
    this.tableLoading = true;
    this.reportsService
      .getTransactionsReport(form)
      .then((result) => {
        if (
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.tableData.transactions = result.response;
          this.prepareDataSource();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.warning`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.transactions = [];
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
  private initialFormSubmission() {
    this.cusid.setValue('all');
    let form = { ...this.filterTableFormGroup.value };
    form.compid = this.userProfile.InstID;
    if (form.stdate) {
      form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
    }
    if (form.enddate) {
      form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
    }
    this.requestTransactionDetailsList(form);
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createRequestFormGroup();
    this.createHeadersFormGroup();
    this.buildPage();
    this.initialFormSubmission();
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
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.transactions,
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
    if (this.tableData.transactions.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.tableData.transactions,
        this.getActiveTableKeys(),
        'transaction_details_report',
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
  invoiceNumberToBase64(invoice_number: string) {
    return btoa(invoice_number);
  }
  submitForm() {
    if (this.filterTableFormGroup.valid) {
      let form = { ...this.filterTableFormGroup.value };
      form.compid = this.userProfile.InstID;
      if (form.stdate) {
        form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
      }
      if (form.enddate) {
        form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
      }
      this.requestTransactionDetailsList(form);
    } else {
      this.filterTableFormGroup.markAllAsTouched();
    }
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
