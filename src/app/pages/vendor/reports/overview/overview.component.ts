import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  NO_ERRORS_SCHEMA,
  ViewChild,
} from '@angular/core';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import Chart from 'chart.js/auto';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [TableDateFiltersComponent, CommonModule, TranslocoModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class OverviewComponent {
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  @ViewChild('overviewChart') overviewChart!: ElementRef;
  @ViewChild('invoiceSummary') invoiceSummary!: ElementRef;
  public customers: any[] = [];
  public overviewChartData: any;
  public invoiceSummaryData: any;
  public transactionsChartData: any;
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
        labels: ['Paid', 'Pending', 'Cancelled'],
        datasets: [
          {
            label: 'Invoices',
            data: [300, 50, 653],
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
  constructor() {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.createOverviewChart();
    this.createSummaryChart();
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
