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
import { Router, RouterModule } from '@angular/router';
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
import { Observable, TimeoutError, from, of, zip } from 'rxjs';
import { InvoiceListTable } from 'src/app/core/enums/vendor/invoices/invoice-list-table';
import { GeneratedInvoiceListTable } from 'src/app/core/enums/vendor/invoices/generated-invoice-list-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';

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
    MatTableModule,
    MatSortModule,
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
  public tableData: {
    generatedInvoices: GeneratedInvoice[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<GeneratedInvoice>;
  } = {
    generatedInvoices: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<GeneratedInvoice>([]),
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public invoiceStatistics: DashboardOverviewStatistic[] = [];
  @ViewChild('transactionChart') transactionChart!: ElementRef;
  @ViewChild('operationsChart') operationsChart!: ElementRef;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  //create formGroup for each header item in table
  private createHeadersForm() {
    let TABLE_SHOWING = 6;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`dashboard.latestTransactionsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(
              index === 0 ? false : index < TABLE_SHOWING,
              []
            ),
            label: this.fb.control(column.label, []),
            value: this.fb.control(column.value, []),
          });
          col.get(`included`)?.valueChanges.subscribe((included) => {
            this.resetTableColumns();
          });
          this.headers.push(col);
        });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableData.tableColumns$ = of(this.tableData.tableColumns);
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
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: GeneratedInvoice,
      filter: string
    ) => {
      return data.Invoice_No.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Control_No &&
          data.Control_No.toLocaleLowerCase().includes(
            filter.toLocaleLowerCase()
          ))
        ? true
        : false ||
          (data.Chus_Name &&
            data.Chus_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private dataSourceSortingAccessor() {
    this.tableData.dataSource.sortingDataAccessor = (
      item: any,
      property: string
    ) => {
      switch (property) {
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<GeneratedInvoice>(
      this.tableData.generatedInvoices
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
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
      this.tableData.generatedInvoices = results.response;
      this.prepareDataSource();
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
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Chus_Name':
      case 'Invoice_No':
      case 'Invoice_Date':
      case 'Payment_Type':
      case 'Total':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Total':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Invoice_No':
        return `${style} text-black font-semibold`;
      case 'Payment_Type':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.Payment_Type,
          `Fixed`,
          `bg-purple-100`,
          `text-purple-700`,
          `bg-teal-100`,
          `text-teal-700`
        )} text-center w-fit`;
      case 'Total':
        return `${style} text-right`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.generatedInvoices,
          element
        );
      case 'Invoice_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      case 'Total':
        return (
          PerformanceUtils.moneyFormat(element[key].toString()) +
          ' ' +
          element['Currency_Code']
        );
      default:
        return element[key];
    }
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
