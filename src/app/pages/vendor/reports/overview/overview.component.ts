import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NO_ERRORS_SCHEMA,
  ViewChild,
} from '@angular/core';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import Chart from 'chart.js/auto';
import { from, zip } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoginResponse } from 'src/app/core/models/login-response';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    TableDateFiltersComponent,
    CommonModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class OverviewComponent {
  public overviewLoading: boolean = false;
  public tableLoading: boolean = false;
  public customers: any[] = [];
  public overviewChartData: any;
  public invoiceSummaryData: any;
  public transactionsChartData: any;
  private userProfile!: LoginResponse;
  public invoiceStatistics: DashboardOverviewStatistic[] = [];
  public invoiceStatisticsData: DashboardOverviewStatistic[] = [];
  @ViewChild('overviewChart') overviewChart!: ElementRef;
  @ViewChild('invoiceSummary') invoiceSummary!: ElementRef;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private invoiceService: InvoiceService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createOverviewChart() {
    let canvas = this.overviewChart.nativeElement as HTMLCanvasElement;
    this.overviewChartData = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday ',
        ],
        datasets: [
          {
            label: 'ABC Company',
            data: [2112, 2343, 2545, 3423, 2365, 1985, 987],
          },
          {
            label: 'XYZ Entreprises',
            data: [4321, 2343, 5432, 2312, 2483, 1223, 2334],
          },
          {
            label: 'DEF Technologies',
            data: [4325, 2132, 5430, 1987, 2678, 1432, 2789],
          },
          {
            label: 'GHI Solutions',
            data: [3123, 1654, 4332, 2789, 3210, 1876, 2567],
          },
          {
            label: 'JKL Innovations',
            data: [4323, 2543, 5645, 2198, 2897, 1678, 2890],
          },
        ],
      },
      options: {
        responsive: true,
        aspectRatio: 2.5,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value, index, ticks) {
                return value + ' TZS';
              },
              autoSkip: true,
              maxTicksLimit: 1000,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context: any) {
                return context.formattedValue + ' /TZS';
              },
            },
          },
        },
      },
    });
  }
  private createSummaryChart() {
    let canvas = this.invoiceSummary.nativeElement as HTMLCanvasElement;
    this.invoiceSummaryData = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.invoiceStatistics.map((i) => i.Name),
        datasets: [
          {
            label: 'Invoices',
            data: this.invoiceStatistics.map((i) => i.Statistic),
            hoverOffset: 4,
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
    if (typeof result === 'string' && typeof result === 'number') {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`dashboard.dashboard.invoiceData.message`)
      );
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
      this.createSummaryChart();
    }
  }
  private buildPage() {
    this.overviewLoading = true;
    let invoiceStatisticsObs = from(
      this.invoiceService.getCompanysInvoiceStats({
        compid: this.userProfile.InstID,
      })
    );
    let mergedObs = zip(invoiceStatisticsObs);
    let res = AppUtilities.pipedObservables(mergedObs);
    res
      .then((results) => {
        let [invoiceStatistics] = results;
        this.assignInvoiceStatistics(invoiceStatistics);
        this.overviewLoading = true;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.overviewLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.buildPage();
  }
  ngAfterViewInit(): void {
    this.createOverviewChart();
    // this.createSummaryChart();
  }
}
