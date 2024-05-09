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
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoginResponse } from 'src/app/core/models/login-response';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';

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
  private userProfile!: LoginResponse;
  public inboxApprovals: any[] = [];
  public transactions: any[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public generatedInvoices: GeneratedInvoice[] = [];
  public generatedInvoicesData: GeneratedInvoice[] = [];
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headersMap = {
    CUSTOMER_NAME: 0,
    INVOICE_NUMBER: 1,
    INVOICE_DATE: 2,
    PAYMENT_TYPE: 3,
    TOTAL_AMOUNT: 4,
    DELIVERY_STATUS: 5,
  };
  public overviewCards = [
    {
      statistic: 12,
      label: 'Paid Invoice',
      imgUrl: 'assets/img/transaction.png',
      link: '/vendor/invoice/generated',
      increase: true,
      lang: 'paidInvoice',
    },
    {
      statistic: 0,
      label: 'Due Invoice',
      imgUrl: 'assets/img/check-mark.png',
      link: '/vendor/invoice/amendments',
      increase: false,
      lang: 'dueInvoice',
    },
    {
      statistic: 18,
      label: 'Invoice expired',
      imgUrl: 'assets/img/customer-review.png',
      link: '/vendor/invoice/cancelled',
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
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
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
      case this.headersMap.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No > b.Invoice_No ? 1 : -1
        );
        break;
      case this.headersMap.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) > new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case this.headersMap.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a?.Chus_Name?.trim() > b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() > b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total > b.Total ? 1 : -1));
        break;
      case this.headersMap.DELIVERY_STATUS:
        this.generatedInvoices.sort((a, b) =>
          a?.delivery_status?.trim() > b?.delivery_status.trim() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case this.headersMap.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No < b.Invoice_No ? 1 : -1
        );
        break;
      case this.headersMap.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) < new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case this.headersMap.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a?.Chus_Name?.trim() < b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() < b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total < b.Total ? 1 : -1));
        break;
      case this.headersMap.DELIVERY_STATUS:
        this.generatedInvoices.sort((a, b) =>
          a?.delivery_status?.trim() < b?.delivery_status?.trim() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  //request generted invoice
  private requestGeneratedInvoice() {
    this.tableLoading = true;
    this.invoiceService
      .postSignedDetails({ compid: this.userProfile.InstID })
      .then((results: any) => {
        this.generatedInvoicesData =
          results.response === 0 ? [] : results.response;
        this.generatedInvoices = this.generatedInvoicesData;
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
      });
  }
  //create formGroup for each header item in table
  private createHeadersForm() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.tr
      .selectTranslate(`dashboard.latestTransactionsTable`, {}, this.scope)
      .subscribe((labels: string[]) => {
        labels.forEach((label, index) => {
          let header = this.fb.group({
            label: this.fb.control(label, []),
            search: this.fb.control('', []),
            sortAsc: this.fb.control('', []),
            values: this.fb.array([], []),
            included: this.fb.control(index < 5, []),
          });
          this.tableHeaderFilterValues(header, index);
          header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
            if (value === true) {
              this.sortTableAsc(index);
            } else {
              this.sortTableDesc(index);
            }
          });
          this.headers.push(header);
        });
      });
  }
  //creates a name and an active state FormControl, filtering data when the active state changes
  private tableHeaderFilterValues(header: FormGroup, index: number) {
    let values: string[] = this.getTableColumnDataVariations(index);
    values.forEach((elem) => {
      let value = this.fb.group({
        name: this.fb.control(elem.trim(), []),
        isActive: this.fb.control(true, []),
      });
      value.get('isActive')?.valueChanges.subscribe((value: string | any) => {
        let filteringIndexes = [
          this.headersMap.DELIVERY_STATUS,
          this.headersMap.PAYMENT_TYPE,
        ];
        this.generatedInvoices = this.filterTable(filteringIndexes);
      });
      (header.get('values') as FormArray).push(value);
    });
  }
  //finds the inActive values within the formArrays and filters their data
  private filterTable(indexes: number[]) {
    let [deliveryStatus, paymentType] = indexes;
    let deliveryStatusArr = this.headers
      ?.at(deliveryStatus)
      ?.get('values') as FormArray;
    let payments = this.headers?.at(paymentType)?.get('values') as FormArray;
    let deliveryStatusValues = deliveryStatusArr.controls
      .filter((v) => v.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    let paymentValues = payments.controls
      .filter((p) => p.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    if (!deliveryStatusValues || !paymentValues) {
      return [];
    }
    return this.generatedInvoicesData.filter((f) => {
      return (
        deliveryStatusValues.indexOf(
          f.delivery_status.trim().toLocaleLowerCase()
        ) !== -1 &&
        paymentValues.indexOf(f.Payment_Type.trim().toLocaleLowerCase()) !== -1
      );
    });
  }
  //Given a column index, this function returns all unique values of the specified key in the arrays.
  private getTableColumnDataVariations(ind: number) {
    switch (ind) {
      case this.headersMap.DELIVERY_STATUS:
        let delivery_statusArr = new Set(
          this.generatedInvoicesData.map((elem) => elem.delivery_status)
        );
        return delivery_statusArr.size <= 10 ? [...delivery_statusArr] : [];
      case this.headersMap.PAYMENT_TYPE:
        let paymentType = new Set(
          this.generatedInvoicesData.map((e) => e.Payment_Type)
        );
        return paymentType.size <= 10 ? [...paymentType] : [];
      default:
        return [];
    }
  }
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
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeadersForm();
    this.requestGeneratedInvoice();
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
}
