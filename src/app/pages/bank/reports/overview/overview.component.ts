import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { ChartType, GoogleChartsModule } from 'angular-google-charts';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { Chart } from 'tw-elements';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    RouterModule,
    GoogleChartsModule,
    TableDateFiltersComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class OverviewComponent implements AfterViewInit {
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  @ViewChild('transactionsChart') transactionsChart!: ElementRef;
  @ViewChild('summaryChart') summaryChart!: ElementRef;
  @ViewChild('overviewChart') overviewChart!: ElementRef;
  title = 'Transactions made last year';
  bar = ChartType.BarChart;
  pie = ChartType.PieChart;
  line = ChartType.Line;
  data = [
    ['Jan-Mar', 45.0],
    ['Apr-Jul', 26.8],
    ['Aug-Oct', 12.8],
    ['Nov-Dec', 8.5],
  ];
  columnNames = ['Months', 'Amount'];
  options = {};
  public customers: any[] = [];
  private createOverviewChart() {
    const dataChartTooltipsFormattingExample = {
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
            label: 'Sales',
            data: [2112, 2343, 2545, 3423, 2365, 1985, 987],
          },
        ],
      },
    };

    // Options
    const optionsChartTooltipsFormattingExample = {
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context: any) {
                return ' $' + context.formattedValue;
              },
            },
          },
        },
      },
    };

    new Chart(
      this.overviewChart.nativeElement as HTMLCanvasElement,
      dataChartTooltipsFormattingExample,
      optionsChartTooltipsFormattingExample
    );
  }
  private createSummaryChart() {
    const dataChartDataLabelsExample = {
      type: 'pie',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [
          {
            label: 'Traffic',
            data: [30, 45, 62, 65, 61],
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
    };

    // Options
    const optionsChartDataLabelsExample = {
      dataLabelsPlugin: true,
      options: {
        plugins: {
          datalabels: {
            formatter: (value: any, ctx: any) => {
              let sum = 0;
              // Assign the data to the variable and format it according to your needs
              let dataArr = dataChartDataLabelsExample.data.datasets[0].data;
              dataArr.map((data) => {
                sum += data;
              });
              let percentage = ((value * 100) / sum).toFixed(2) + '%';
              return percentage;
            },
            color: 'white',
            labels: {
              title: {
                font: {
                  size: '14',
                },
              },
            },
          },
        },
      },
    };

    new Chart(
      this.summaryChart.nativeElement as HTMLCanvasElement,
      dataChartDataLabelsExample,
      optionsChartDataLabelsExample
    );
  }
  private createTransactionChart() {
    const dataChartFunnelExample = {
      type: 'bar',
      data: {
        labels: ['Product views', 'Checkout', 'Purchases'],
        datasets: [
          {
            data: [2112, 343, 45],
            barPercentage: 1.24,
          },
        ],
      },
    };

    // Options
    const optionsChartFunnelExample = {
      dataLabelsPlugin: true,
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            grid: {
              offsetGridLines: true,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          datalabels: {
            formatter: (value: any, ctx: any) => {
              let sum = 0;
              let dataArr = dataChartFunnelExample.data.datasets[0].data;
              dataArr.map((data) => {
                sum += data;
              });
              let percentage = ((value * 100) / sum).toFixed(2) + '%';
              return percentage;
            },
            color: '#4f4f4f',
            labels: {
              title: {
                font: {
                  size: '13',
                },
                anchor: 'end',
                align: 'right',
              },
            },
          },
        },
      },
    };

    const optionsDarkModeChartFunnelExample = {
      options: {
        scales: {
          y: {
            ticks: {
              color: '#fff',
            },
          },
          x: {
            ticks: {
              color: '#fff',
            },
          },
        },
        plugins: {
          datalabels: {
            color: '#fff',
          },
        },
      },
    };

    new Chart(
      this.transactionsChart.nativeElement as HTMLCanvasElement,
      dataChartFunnelExample,
      optionsChartFunnelExample,
      optionsDarkModeChartFunnelExample
    );
  }
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
