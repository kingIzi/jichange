import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import Chart from 'chart.js/auto';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TransactionDetailsReportForm } from 'src/app/core/models/bank/forms/reports/transaction-details-report-form';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { Observable, from, of, zip } from 'rxjs';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { InvoiceReportFormBanker } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSortModule, MatSort } from '@angular/material/sort';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    CommonModule,
    RouterModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class OverviewComponent implements OnInit, AfterViewInit {
  @ViewChild('transactionsChart', { static: true })
  transactionsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('invoiceSummary', { static: true })
  invoiceSummary!: ElementRef<HTMLCanvasElement>;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  public headersFormGroup!: FormGroup;
  public customers: any[] = [];
  // public transactionsChartLoading: boolean = false;
  // public statisticChartLoading: boolean = false;
  // public invoicePieChartLoading: boolean = false;
  public buildPageLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public userProfile!: LoginResponse;
  public tableData: {
    latestTransactions: TransactionDetail[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<TransactionDetail>;
  } = {
    latestTransactions: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<TransactionDetail>([]),
  };
  public graphData: {
    transactions: TransactionDetail[];
    invoiceStatistics: DashboardOverviewStatistic[];
    invoices: InvoiceReport[];
  } = {
    transactions: [],
    invoiceStatistics: [],
    invoices: [],
  };
  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private tr: TranslocoService,
    private fb: FormBuilder,
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
    let TABLE_SHOWING = 9;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`overview.vendorsTable`, {}, this.scope)
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  private transactionsLineChartDataset(transactions: TransactionDetail[]) {
    let labels = [];
    let paymentAmounts = [];
    let aggregatedData = transactions.reduce((acc, item) => {
      let date = new Date(item.Payment_Date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += item.PaidAmount ? item.PaidAmount : 0;
      return acc;
    }, {} as any);
    for (let [date, amount] of Object.entries(aggregatedData)) {
      labels.push(date);
      paymentAmounts.push(amount);
    }
    return [labels, paymentAmounts];
  }
  private invoicePieChartDataset(invoices: InvoiceReport[]) {
    let aggregatedData = invoices.reduce((acc, item) => {
      let paymentType = item.Payment_Type;
      if (!acc[paymentType]) {
        acc[paymentType] = 0;
      }
      //acc[paymentType] += item.Total ? item.Total : 0;
      acc[paymentType] += 1;
      return acc;
    }, {} as any);
    let labels = Object.keys(aggregatedData);
    let totalAmounts = Object.values(aggregatedData);
    return [labels, totalAmounts];
  }
  private createTransactionsChart(transactions: TransactionDetail[]) {
    let [labels, paymentAmounts] =
      this.transactionsLineChartDataset(transactions);
    let canvas = this.transactionsChart.nativeElement;
    let paymentChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Payment Amount',
            data: paymentAmounts,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        aspectRatio: 2.5,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Amount (TZS)',
            },
            ticks: {
              stepSize: 7000000,
              callback: function (value) {
                return value.toLocaleString();
              },
            },
            //min: 1, // Set minimum value for y-axis to avoid log(0)
            //max: Math.max(...(paymentAmounts as any)) * 1.1,
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context: any) {
                return context.formattedValue + ' TZS';
              },
            },
          },
        },
      },
    });
  }
  private createInvoiceTypePieChart(invoices: InvoiceReport[]) {
    let [labels, totalAmounts] = this.invoicePieChartDataset(invoices);
    let canvas = this.invoiceSummary.nativeElement;
    let invoiceSummary = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total',
            data: totalAmounts,
            hoverOffset: 4,
            backgroundColor: ['#7E22CE', '#0F766E'],
          },
        ],
      },
      options: {
        responsive: true,
        aspectRatio: 2.5,
        maintainAspectRatio: false,
      },
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
      this.tableData.latestTransactions
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private buildPage() {
    let transactionsForm = {
      branch: this.userProfile.braid,
      compid: 'all',
      cusid: 'all',
      stdate: '',
      enddate: '',
    } as TransactionDetailsReportForm;
    let invoiceForm = {
      branch: this.userProfile.braid,
      Comp: 'all',
      cusid: 'all',
      stdate: '',
      enddate: '',
    } as InvoiceReportFormBanker;
    this.buildPageLoading = true;
    let transactionsObs = from(
      this.reportsService.getTransactionsReport(transactionsForm)
    );
    let bankerInvoiceStatsObs = from(
      this.reportsService.getBankerInvoiceStats({
        sessB: this.userProfile.sessb,
      })
    );
    let invoiceObs = from(
      this.invoiceReportService.getInvoiceReport(invoiceForm)
    );
    let latestTransactionsObs = from(
      this.reportsService.getLatestTransactionsList({})
    );
    let merged = zip(
      transactionsObs,
      bankerInvoiceStatsObs,
      invoiceObs,
      latestTransactionsObs
    );
    let res = AppUtilities.pipedObservables(merged);
    res
      .then((results) => {
        let [
          transactionsList,
          invoiceStats,
          invoiceList,
          latestTransactionsList,
        ] = results;
        if (
          typeof transactionsList.response !== 'number' &&
          typeof transactionsList.response !== 'string'
        ) {
          this.graphData.transactions = transactionsList.response;
        }
        if (
          typeof invoiceStats.response !== 'string' &&
          typeof invoiceStats.response !== 'number'
        ) {
          this.graphData.invoiceStatistics = invoiceStats.response;
        }
        if (
          typeof invoiceList.response !== 'string' &&
          typeof invoiceList.response !== 'number'
        ) {
          this.graphData.invoices = invoiceList.response;
        }
        if (
          typeof latestTransactionsList.response !== 'string' &&
          typeof latestTransactionsList.response !== 'number'
        ) {
          this.tableData.latestTransactions = latestTransactionsList.response;
        }
        this.createTransactionsChart(this.graphData.transactions);
        this.createInvoiceTypePieChart(this.graphData.invoices);
        this.prepareDataSource();
        this.buildPageLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.buildPageLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeadersFormGroup();
  }
  ngAfterViewInit(): void {
    this.buildPage();
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
      case 'Payer_Name':
      case 'Status':
      case 'Control_No':
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
          this.tableData.latestTransactions,
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
          element['Currency']
        );
      default:
        return element[key] ? element[key] : '-';
    }
  }
  invoiceNumberToBase64(invoice_number: string) {
    return btoa(invoice_number);
  }
  dashboardStatisticRouterLink(name: string) {
    switch (name.toLocaleLowerCase()) {
      case 'Transaction'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/transactions'], {
          queryParams: { q: btoa(name) },
        });
        break;
      case 'Vendor'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/vendors'], {
          queryParams: { q: btoa(name) },
        });
        break;
      case 'Users'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/userlog']);
        break;
      case 'Pendings'.toLocaleLowerCase():
        this.router.navigate(['/main/company/inbox']);
        break;
      case 'Customers'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/customer'], {
          queryParams: { q: btoa(name) },
        });
        break;
      default:
        this.router.navigate(['/main']);
        break;
    }
  }
  get headers() {
    return this.headersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
