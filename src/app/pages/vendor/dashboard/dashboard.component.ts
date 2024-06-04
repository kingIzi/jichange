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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { VendorDashboardOverviewCardComponent } from 'src/app/components/cards/vendor-dashboard-overview-card/vendor-dashboard-overview-card.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
//import { Chart } from 'tw-elements';
import Chart from 'chart.js/auto';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  Form,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoginResponse } from 'src/app/core/models/login-response';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TimeoutError, from, zip } from 'rxjs';
import { InvoiceListTable } from 'src/app/core/enums/vendor/invoices/invoice-list-table';
import { GeneratedInvoiceListTable } from 'src/app/core/enums/vendor/invoices/generated-invoice-list-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    VendorDashboardOverviewCardComponent,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/dashboard', alias: 'panel' },
    },
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public overviewLoading: boolean = false;
  private userProfile!: LoginResponse;
  public inboxApprovals: any[] = [];
  public transactions: any[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public generatedInvoices: GeneratedInvoice[] = [];
  public generatedInvoicesData: GeneratedInvoice[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public GeneratedInvoiceListTable: typeof GeneratedInvoiceListTable =
    GeneratedInvoiceListTable;
  public invoiceStatistics: DashboardOverviewStatistic[] = [];
  @ViewChild('transactionChart') transactionChart!: ElementRef;
  @ViewChild('operationsChart') operationsChart!: ElementRef;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case GeneratedInvoiceListTable.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No > b.Invoice_No ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) > new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a.Chus_Name > b.Chus_Name ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() > b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total > b.Total ? 1 : -1));
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case GeneratedInvoiceListTable.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No < b.Invoice_No ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) < new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a?.Chus_Name?.trim() < b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() < b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total < b.Total ? 1 : -1));
        break;
      default:
        break;
    }
  }

  //create formGroup for each header item in table
  private createHeadersForm() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `dashboard.latestTransactionsTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      6,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private createTransactionChart() {
    let canvas = this.transactionChart.nativeElement as HTMLCanvasElement;
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Pending', 'Due', 'Expired'],
        datasets: [
          {
            label: 'Invoice report',
            data: [300, 209, 438, 653],
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.generatedInvoices = this.generatedInvoicesData.filter(
        (elem: GeneratedInvoice) => {
          return (
            elem?.Chus_Name?.toLocaleLowerCase().includes(text) ||
            elem.Invoice_No.toLocaleLowerCase().includes(text) ||
            elem.Payment_Type.toLocaleLowerCase().includes(text)
          );
        }
      );
    } else {
      this.generatedInvoices = this.generatedInvoicesData;
    }
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
      this.invoiceStatistics = result.response as DashboardOverviewStatistic[];
    }
  }
  private assignGeneratedInvoice(
    results: HttpDataResponse<string | GeneratedInvoice[]>
  ) {
    if (typeof results.response === 'string') {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    } else {
      this.generatedInvoicesData = results.response;
      this.generatedInvoices = this.generatedInvoicesData;
    }
    this.tableLoading = false;
    this.cdr.detectChanges();
  }
  private buildPage() {
    this.overviewLoading = true;
    this.tableLoading = true;
    let generatedInvoiceObs = from(
      this.invoiceService.postSignedDetails({ compid: this.userProfile.InstID })
    );
    let invoiceStatisticsObs = from(
      this.invoiceService.getCompanysInvoiceStats({
        compid: this.userProfile.InstID,
      })
    );
    let mergedObs = zip(generatedInvoiceObs, invoiceStatisticsObs);
    let res = AppUtilities.pipedObservables(mergedObs);
    res
      .then((results) => {
        let [generatedInvoices, invoiceStatistics] = results;
        this.assignGeneratedInvoice(generatedInvoices);
        this.assignInvoiceStatistics(invoiceStatistics);
        this.overviewLoading = false;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.overviewLoading = false;
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngAfterViewInit(): void {
    this.createTransactionChart();
    this.createOperationsChart();
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeadersForm();
    this.buildPage();
  }
  dashboardStatisticRouterLink(name: string) {
    switch (name.toLocaleLowerCase()) {
      case 'Transaction'.toLocaleLowerCase():
        return '/vendor/reports/transactions';
      case 'Customer'.toLocaleLowerCase():
        return '/vendor/customers';
      case 'Users'.toLocaleLowerCase():
        return '/vendor/company';
      case 'Pendings'.toLocaleLowerCase():
        return '/vendor/invoice/list';
      case 'Due'.toLocaleLowerCase():
        return '/vendor/reports/invoice';
      case 'Expired'.toLocaleLowerCase():
        return '/vendor/reports/cancelled';
      default:
        return '/vendor';
    }
  }
  openInvoiceDetailsDialog() {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  convertDotNetJSONDate(dotNetJSONDate: string) {
    const timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp).toLocaleDateString();
  }
  getActiveStatusStyles(status: string) {
    return status
      ? status.toLocaleLowerCase() === 'active'
        ? 'bg-green-100 text-green-600 px-4 py-1 rounded-lg shadow'
        : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow'
      : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow';
  }
  moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
