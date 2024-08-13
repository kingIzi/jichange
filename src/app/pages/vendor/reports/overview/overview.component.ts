import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import Chart from 'chart.js/auto';
import { from, zip } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { TransactionDetailsReportForm } from 'src/app/core/models/bank/forms/reports/transaction-details-report-form';
import { CustomerDetailsForm } from 'src/app/core/models/bank/reports/customer-details-form';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { Customer } from 'src/app/core/models/vendors/customer';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { CustomerService } from 'src/app/core/services/vendor/customers/customer.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    TableDateFiltersComponent,
    CommonModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class OverviewComponent implements OnInit, AfterViewInit {
  public buildPageLoading: boolean = false;
  public startLoading: boolean = false;
  public customers: Customer[] = [];
  public invoices: GeneratedInvoice[] = [];
  public transactions: TransactionDetail[] = [];
  public headersFormGroup!: FormGroup;
  public graphData: {
    transactionsLineChartLabels: string[];
    transactionsLineChartData: number[];
  } = {
    transactionsLineChartLabels: [],
    transactionsLineChartData: [],
  };
  public invoiceStatistics: DashboardOverviewStatistic[] = [];
  public invoiceStatisticsData: DashboardOverviewStatistic[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('overviewChart', { static: true })
  overviewChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('invoiceSummary', { static: true })
  invoiceSummary!: ElementRef<HTMLCanvasElement>;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private router: Router,
    private invoiceService: InvoiceService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private customerService: CustomerService,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}
  private createHeadersFormGroup() {
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
  }
  private transactionsLineChartDataset(transactions: TransactionDetail[]) {
    let groupedData = transactions.reduce((acc, curr) => {
      let date = new Date(curr.Payment_Date).toLocaleDateString();
      if (!acc[curr.Customer_Name]) {
        acc[curr.Customer_Name] = {};
      }
      if (!acc[curr.Customer_Name][date]) {
        acc[curr.Customer_Name][date] = 0;
      }
      acc[curr.Customer_Name][date] += curr.Requested_Amount;
      return acc;
    }, {} as any);
    let uniqueDates = [
      ...new Set(
        transactions.map((item) =>
          new Date(item.Payment_Date).toLocaleDateString()
        )
      ),
    ].sort();
    let datasets = Object.keys(groupedData).map((customer) => ({
      label: customer,
      data: uniqueDates.map((date) => groupedData[customer][date] || 0),
    }));
    return [uniqueDates, datasets];
  }
  private createTransactionsLineChart(transactions: TransactionDetail[]) {
    let [uniqueDates, datasets] =
      this.transactionsLineChartDataset(transactions);
    let canvas = this.overviewChart.nativeElement;
    let chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: uniqueDates as string[],
        datasets: datasets as { label: string; data: number[] }[],
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
  private sumarryPieChartData(statistics: DashboardOverviewStatistic[]) {
    let aggregatedData = statistics.reduce((acc, item) => {
      let name = item.Name;
      if (!acc[name]) {
        acc[name] = 0;
      }
      acc[name] += item.Statistic ? item.Statistic : 0;
      acc[name] = Number(acc[name]);
      return acc;
    }, {} as any);
    this.graphData.transactionsLineChartLabels = Object.keys(aggregatedData);
    this.graphData.transactionsLineChartData = Object.values(aggregatedData);
  }
  private createSummaryChart(statistics: DashboardOverviewStatistic[]) {
    this.sumarryPieChartData(statistics);
    let canvas = this.invoiceSummary.nativeElement;
    let chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: this.graphData.transactionsLineChartLabels,
        datasets: [
          {
            label: 'Invoice(s)',
            data: this.graphData.transactionsLineChartData,
            hoverOffset: 4,
            backgroundColor: ['#7E22CE', '#0F766E', '#A21CAF'],
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
  private assignInvoiceStatistics(
    result: HttpDataResponse<string | number | DashboardOverviewStatistic[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
    } else {
      this.invoiceStatisticsData =
        result.response as DashboardOverviewStatistic[];
      this.invoiceStatistics = this.invoiceStatisticsData;
      this.invoiceStatistics = this.invoiceStatistics.filter(
        (i) =>
          i.Name !== 'Transaction' &&
          i.Name !== 'Customer' &&
          i.Name !== 'Users'
      );
      this.createSummaryChart(this.invoiceStatistics);
    }
  }
  private assignTransactionsReport(
    result: HttpDataResponse<string | number | TransactionDetail[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
    } else {
      this.transactions = result.response as TransactionDetail[];
    }
    this.createTransactionsLineChart(this.transactions);
  }
  private assignCustomersList(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
    } else {
      this.customers = result.response as Customer[];
    }
  }
  private assignCreatedInvoiceList(
    result: HttpDataResponse<string | number | GeneratedInvoice[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
    } else {
      this.invoices = result.response as GeneratedInvoice[];
    }
  }
  private getBuildPageRequests() {
    let invoiceStatisticsObs = from(
      this.invoiceService.getCompanysInvoiceStats({
        compid: this.getUserProfile().InstID,
      })
    );
    let form = {
      branch: this.getUserProfile().braid,
      companyIds: [this.getUserProfile().InstID],
      customerIds: [0],
      stdate: '',
      enddate: '',
    } as InvoiceReportForm;
    let transactionsObs = from(this.reportsService.getTransactionsReport(form));
    let customersObs = from(
      this.customerService.getCustomersList({
        vendors: [this.getUserProfile().InstID],
      } as CustomerDetailsForm)
    );
    let createdInvoicesObs = from(
      this.invoiceService.getCreatedInvoiceList({
        compid: this.getUserProfile().InstID,
      })
    );
    let mergedObs = zip(
      invoiceStatisticsObs,
      transactionsObs,
      customersObs,
      createdInvoicesObs
    );
    return mergedObs;
  }
  private buildPage() {
    this.startLoading = true;
    let mergedObs = this.getBuildPageRequests();
    let res = AppUtilities.pipedObservables(mergedObs);
    res
      .then((results) => {
        let [invoiceStatistics, transactionsList, customersList, invoiceList] =
          results;
        this.assignInvoiceStatistics(invoiceStatistics);
        this.assignTransactionsReport(transactionsList);
        this.assignCustomersList(customersList);
        this.assignCreatedInvoiceList(invoiceList);
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.buildPageLoading = false;
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.createHeadersFormGroup();
  }
  ngAfterViewInit(): void {
    this.buildPage();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  dashboardStatisticRouterLink(name: string) {
    switch (name.toLocaleLowerCase()) {
      case 'Transaction'.toLocaleLowerCase():
        this.router.navigate(['/vendor/reports/transactions']);
        break;
      case 'Customer'.toLocaleLowerCase():
        this.router.navigate(['/vendor/customers']);
        break;
      case 'Users'.toLocaleLowerCase():
        this.router.navigate(['/vendor/company']);
        break;
      case 'Pendings'.toLocaleLowerCase():
        this.router.navigate(['/vendor/invoice/list']);
        break;
      case 'Due'.toLocaleLowerCase():
        this.router.navigate(['/vendor/reports/invoice'], {
          queryParams: { q: btoa(name) },
        });
        break;
      case 'Expired'.toLocaleLowerCase():
        this.router.navigate(['/vendor/reports/invoice'], {
          queryParams: { q: btoa(name) },
        });
        break;
      default:
        this.router.navigate(['/vendor']);
        break;
    }
  }
  getTotalInvoiceAmountThousandFormatted() {
    let total = this.invoices.reduce((acc, curr) => {
      acc += curr.Total;
      return acc;
    }, 0);
    if (total >= 1000) {
      // Divide the number by 1000 and round to the nearest integer
      let thousands = Math.round(total / 1000);
      // Format the number with commas
      let formatted = thousands.toLocaleString();
      return formatted + 'K';
    }
    // If the number is less than 1000, just return it as is
    return total.toString();
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
}
