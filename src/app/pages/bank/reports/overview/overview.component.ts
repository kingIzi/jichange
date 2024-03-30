import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
//import { Chart } from 'tw-elements';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    RouterModule,
    TableDateFiltersComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class OverviewComponent implements OnInit, AfterViewInit {
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  @ViewChild('overviewChart') overviewChart!: ElementRef;
  @ViewChild('invoiceSummary') invoiceSummary!: ElementRef;
  @ViewChild('transactionsChart') transactionsChart!: ElementRef;
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
        labels: ['Paid', 'Pending', 'In-Progress', 'Cancelled'],
        datasets: [
          {
            label: 'My First Dataset',
            data: [300, 50, 438, 653],
            hoverOffset: 4,
            backgroundColor: [
              'rgba(63, 81, 181, 0.5)',
              'rgba(77, 182, 172, 0.5)',
              'rgba(66, 133, 244, 0.5)',
              'rgba(156, 39, 176, 0.5)',
              'rgba(233, 30, 99, 0.5)',
            ],
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
  private createTransactionChart() {
    let canvas = this.transactionsChart.nativeElement as HTMLCanvasElement;
    this.transactionsChartData = new Chart(canvas, {
      type: 'bar',
      data: {
        //labels: ['Pending', 'In-Progress', 'Approved', 'Paid'],
        labels: ['Inclusive', 'Exclusive'],
        datasets: [
          {
            label: 'Debit',
            data: [100, 83],
          },
          {
            label: 'Credit',
            data: [21, 12],
          },
        ],
      },
    });
  }
  constructor() {}
  ngOnInit(): void {}
  ngAfterViewInit(): void {
    this.createOverviewChart();
    this.createSummaryChart();
    this.createTransactionChart();
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
