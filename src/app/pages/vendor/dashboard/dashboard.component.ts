import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { VendorDashboardOverviewCardComponent } from 'src/app/components/cards/vendor-dashboard-overview-card/vendor-dashboard-overview-card.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { Chart } from 'tw-elements';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    VendorDashboardOverviewCardComponent,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/dashboard', alias: 'panel' },
    },
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public inboxApprovals: any[] = [];
  public transactions: any[] = [];
  public overviewCards = [
    {
      statistic: 12,
      label: 'Paid Invoice',
      imgUrl: 'assets/img/transaction.png',
      link: '/vendor/invoice',
      increase: true,
      lang: 'paidInvoice',
    },
    {
      statistic: 0,
      label: 'Due Invoice',
      imgUrl: 'assets/img/check-mark.png',
      link: '/vendor/invoice',
      increase: false,
      lang: 'dueInvoice',
    },
    {
      statistic: 18,
      label: 'Invoice expired',
      imgUrl: 'assets/img/customer-review.png',
      link: '/vendor/generated',
      increase: false,
      lang: 'invoiceExpire',
    },
    {
      statistic: 23,
      label: 'Customers',
      imgUrl: 'assets/img/man.png',
      link: '/vendor/customers',
      increase: true,
      lang: 'customers',
    },
  ];
  @ViewChild('transactionChart') transactionChart!: ElementRef;
  @ViewChild('operationsChart') operationsChart!: ElementRef;
  constructor(private dialog: MatDialog) {}
  ngAfterViewInit(): void {
    this.buildTransactionChart();
    this.buildOperationsChart();
  }
  private buildTransactionChart() {
    const dataChartDobuleYAxisExample = {
      type: 'bar',
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
        // datasets: [
        //   {
        //     label: 'Impressions',
        //     yAxisID: 'y',
        //     data: [2112, 2343, 2545, 3423, 2365, 1985, 987],
        //     order: 2,
        //   },
        //   {
        //     label: 'Impressions (absolute top) %',
        //     yAxisID: 'y1',
        //     data: [1.5, 2, 0.5, 3, 1.2, 4, 3.4],
        //     type: 'line',
        //     order: 1,
        //     backgroundColor: 'rgba(66, 133, 244, 0.0)',
        //     borderColor: '#94DFD7',
        //     borderWidth: 2,
        //     pointBorderColor: '#94DFD7',
        //     pointBackgroundColor: '#94DFD7',
        //     lineTension: 0.0,
        //   },
        // ],
        datasets: [
          {
            label: 'Transactions',
            yAxisID: 'y',
            data: [2112, 2343, 2545, 3423, 2365, 1985, 987],
            order: 2,
          },
          {
            label: 'Transactions (absolute top) %',
            yAxisID: 'y1',
            data: [1.5, 2, 0.5, 3, 1.2, 4, 3.4],
            type: 'line',
            order: 1,
            backgroundColor: 'rgba(66, 133, 244, 0.0)',
            borderColor: '#94DFD7',
            borderWidth: 2,
            pointBorderColor: '#94DFD7',
            pointBackgroundColor: '#94DFD7',
            lineTension: 0.0,
          },
        ],
      },
    };

    // Options
    const optionsChartDobuleYAxisExample = {
      options: {
        scales: {
          y: {
            display: true,
            position: 'left',
          },
          y1: {
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              beginAtZero: true,
            },
          },
        },
      },
    };

    const optionsDarkModeChartDobuleYAxisExample = {
      options: {
        scales: {
          y: {
            ticks: {
              color: '#fff',
            },
          },
          y1: {
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
          legend: {
            labels: {
              color: '#fff',
            },
          },
        },
      },
    };
    new Chart(
      this.transactionChart.nativeElement as HTMLCanvasElement,
      dataChartDobuleYAxisExample,
      optionsChartDobuleYAxisExample,
      optionsDarkModeChartDobuleYAxisExample
    );
  }
  private buildOperationsChart() {
    const dataChartBarDoubleDatasetsExample = {
      type: 'bar',
      data: {
        labels: ['Inclusive', 'Exclusive'],
        datasets: [
          {
            label: 'CREDIT',
            data: [510, 653, 255],
          },
          {
            label: 'DEBIT',
            data: [1251, 1553, 1355],
            backgroundColor: '#94DFD7',
            borderColor: '#94DFD7',
          },
        ],
      },
    };

    // Options
    const optionsChartBarDoubleDatasetsExample = {
      options: {
        scales: {
          y: {
            stacked: false,
            ticks: {
              beginAtZero: true,
            },
          },
          x: {
            stacked: false,
          },
        },
      },
    };

    new Chart(
      this.operationsChart.nativeElement as HTMLCanvasElement,
      dataChartBarDoubleDatasetsExample,
      optionsChartBarDoubleDatasetsExample
    );
  }
  ngOnInit(): void {}
  openInvoiceDetailsDialog() {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
}
