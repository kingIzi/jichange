import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { ChartType, GoogleChartsModule } from 'angular-google-charts';
import { DashboardOverviewCardComponent } from 'src/app/components/cards/dashboard-overview-card/dashboard-overview-card.component';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Chart, initTE } from 'tw-elements';
import { BreadcrumbService } from 'xng-breadcrumb';
import * as json from 'src/assets/temp/data.json';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DashboardOverviewCardComponent,
    TranslocoModule,
    GoogleChartsModule,
    TableDateFiltersComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/dashboard', alias: 'panel' },
    },
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public overviewCards = [
    {
      statistic: 12,
      label: 'Transaction',
      imgUrl: 'assets/img/transaction.png',
      link: '/main/reports/invoice',
      increase: true,
      lang: 'transaction',
    },
    {
      statistic: 0,
      label: 'Pending approval',
      imgUrl: 'assets/img/check-mark.png',
      link: '/main/company/inbox',
      increase: false,
      lang: 'pendingApproval',
    },
    {
      statistic: 18,
      label: 'Customers',
      imgUrl: 'assets/img/customer-review.png',
      link: '/main/reports/customer',
      increase: false,
      lang: 'customers',
    },
    {
      statistic: 23,
      label: 'Users',
      imgUrl: 'assets/img/man.png',
      link: '/main/company/summary',
      increase: true,
      lang: 'users',
    },
  ];
  public inboxApprovals: any[] = [];
  public customers: any[] = [];
  public transactions: any[] = [];
  //@ViewChild('chartCanvas') chartCanvas!: ElementRef;
  constructor(
    private translocoService: TranslocoService,
    private breadcrumbService: BreadcrumbService
  ) {}
  ngOnInit(): void {
    this.breadcrumbService.set('@dashboard', 'Child One');
    let data = JSON.parse(JSON.stringify(json));
    this.customers = data.dashboardVendors;
    this.transactions = data.transactionDetails;
  }
  ngAfterViewInit(): void {
    //this.buildOperationsChart();
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
  getDate(months: any[], date: Date = new Date()) {
    return AppUtilities.translatedDate(date, months);
  }
  convertDotNetJSONDate(dotNetJSONDate: string) {
    const timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp);
  }
  moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  determineDate(date: Date) {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    let isToday = today.getTime() === date.getTime();
    let months: string[] = this.translocoService.translate(`utilities.months`);
    if (isToday) {
      let todayMsg = this.translocoService.translate(`utilities.today`);
      return todayMsg + ', ' + this.getDate(months, date);
    }
    let yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    let isYesterday = yesterday.getTime() === date.getTime();
    if (isYesterday) {
      let yesterdayMsg = this.translocoService.translate(`utilities.yesterday`);
      return yesterdayMsg + ', ' + this.getDate(months, date);
    }
    let days: { name: string; abbreviation: string }[] =
      this.translocoService.translate(`utilities.daysOfWeek`);
    return (
      days.at(date.getDay())?.abbreviation + ', ' + this.getDate(months, date)
    );
  }
}
