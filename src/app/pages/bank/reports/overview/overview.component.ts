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
import { TransactionDetailsReportForm } from 'src/app/core/models/bank/forms/reports/transaction-details-report-form';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { Observable, from, of, zip } from 'rxjs';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import {
  InvoiceReportForm,
  InvoiceReportFormBanker,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
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
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

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
    {
      provide: VENDOR_TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class OverviewComponent implements OnInit, AfterViewInit {
  @ViewChild('transactionsChart', { static: false })
  transactionsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('invoiceSummary')
  invoiceSummary!: ElementRef<HTMLCanvasElement>;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  public headersFormGroup!: FormGroup;
  public customers: any[] = [];
  public buildPageLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
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
    private appConfig: AppConfigService,
    private router: Router,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<TransactionDetail>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersFormGroup() {
    let TABLE_SHOWING = 9;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`overview.vendorsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
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
              //col.disable();
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
      acc[paymentType] += 1;
      return acc;
    }, {} as any);
    let labels = Object.keys(aggregatedData);
    let totalAmounts = Object.values(aggregatedData);
    return [labels, totalAmounts];
  }
  private createTransactionsChart(transactions: TransactionDetail[]) {
    this.cdr.detectChanges();
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
    // let filterPredicate = (data: TransactionDetail, filter: string) => {
    //   return data.Invoice_Sno.toLocaleLowerCase().includes(
    //     filter.toLocaleLowerCase()
    //   );
    // };
    let filterPredicate = (data: TransactionDetail, filter: string) => {
      // return data.Invoice_Sno.toLocaleLowerCase().includes(
      //   filter.toLocaleLowerCase()
      // ) ||
      //   (data.Control_No &&
      //     data.Control_No.toLocaleLowerCase().includes(
      //       filter.toLocaleLowerCase()
      //     ))
      //   ? true
      //   : false;
      return data.Invoice_Sno.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      )
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
    this.tableDataService.setDataSourceFilterPredicate(sortingDataAccessor);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<TransactionDetail>(
  //     this.tableData.latestTransactions
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private getBuildPageRequests() {
    let transactionsForm = {
      companyIds: [0],
      customerIds: [0],
      stdate: '',
      enddate: '',
    } as InvoiceReportForm;
    let invoiceForm = {
      branch: Number(this.getUserProfile().braid),
      companyIds: [0],
      customerIds: [0],
      stdate: '',
      enddate: '',
    } as InvoiceReportForm;
    this.buildPageLoading = true;
    let transactionsObs = from(
      this.reportsService.getTransactionsReport(transactionsForm)
    );
    let bankerInvoiceStatsObs = from(
      this.reportsService.getBankerInvoiceStats({
        branch: Number(this.getUserProfile().braid),
      })
    );
    let invoiceObs = from(
      this.invoiceReportService.getInvoiceReport(invoiceForm)
    );
    let latestTransactionsObs = from(
      this.reportsService.getLatestTransactionsList({
        branch: this.appConfig.getLoginResponse().braid,
      })
    );
    let merged = zip(
      transactionsObs,
      bankerInvoiceStatsObs,
      invoiceObs,
      latestTransactionsObs
    );
    return merged;
  }
  private parseTransactionsListResponse(
    result: HttpDataResponse<string | number | TransactionDetail[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
      this.graphData.transactions = [];
    } else {
      this.graphData.transactions = result.response as TransactionDetail[];
    }
  }
  private parseInvoiceStatisticsResponse(
    result: HttpDataResponse<string | number | DashboardOverviewStatistic[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
      this.graphData.invoiceStatistics = [];
    } else {
      this.graphData.invoiceStatistics =
        result.response as DashboardOverviewStatistic[];
    }
  }
  private parseInvoiceListResponse(
    result: HttpDataResponse<number | InvoiceReport[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
      this.graphData.invoices = [];
    } else {
      this.graphData.invoices = result.response as InvoiceReport[];
    }
  }
  private parseLatestTransactionsResponse(
    result: HttpDataResponse<string | number | TransactionDetail[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as TransactionDetail[]);
    }
  }
  private buildPage() {
    let merged = this.getBuildPageRequests();
    let res = AppUtilities.pipedObservables(merged);
    res
      .then((results) => {
        let [
          transactionsList,
          invoiceStats,
          invoiceList,
          latestTransactionsList,
        ] = results;
        this.parseTransactionsListResponse(transactionsList);
        this.parseInvoiceStatisticsResponse(invoiceStats);
        this.parseInvoiceListResponse(invoiceList);
        this.parseLatestTransactionsResponse(latestTransactionsList);
        this.createTransactionsChart(this.graphData.transactions);
        this.createInvoiceTypePieChart(this.graphData.invoices);
        this.tableDataService.prepareDataSource(this.paginator, this.sort);
        this.dataSourceFilter();
        this.dataSourceSortingAccessor();

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
  private invoiceStatusStyle(status: string) {
    return `${PerformanceUtils.getActiveStatusStyles(
      status,
      'Passed',
      'bg-green-100',
      'text-green-700',
      'bg-orange-100',
      'text-orange-700'
    )} text-center w-fit`;
  }
  ngOnInit(): void {
    this.createHeadersFormGroup();
  }
  ngAfterViewInit(): void {
    this.buildPage();
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
    return this.headersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
