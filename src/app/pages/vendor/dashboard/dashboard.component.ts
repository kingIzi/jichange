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
//import { Chart } from 'tw-elements';
import Chart from 'chart.js/auto';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';

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
    MatPaginatorModule,
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
  private createTransactionChart() {
    let canvas = this.transactionChart.nativeElement as HTMLCanvasElement;
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Paid', 'Pending', 'In-Progress', 'Cancelled'],
        datasets: [
          {
            label: 'Total Status',
            data: [300, 209, 438, 653],
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
  private createOperationsChart() {
    let canvas = this.operationsChart.nativeElement as HTMLCanvasElement;
    new Chart(canvas, {
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
            data: [2112, 2343, -2545, 3423, 2365, 1985, 987],
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
              callback: function (value: any, index: any, ticks: any) {
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
  ngAfterViewInit(): void {
    this.createTransactionChart();
    this.createOperationsChart();
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
