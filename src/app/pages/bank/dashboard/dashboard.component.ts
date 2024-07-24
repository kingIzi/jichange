import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DashboardOverviewCardComponent } from 'src/app/components/cards/dashboard-overview-card/dashboard-overview-card.component';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Chart, initTE } from 'tw-elements';
import { BreadcrumbService } from 'xng-breadcrumb';
import * as json from 'src/assets/temp/data.json';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company/company';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import {
  Observable,
  TimeoutError,
  catchError,
  from,
  lastValueFrom,
  map,
  of,
  zip,
} from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { CompanySummaryDialogComponent } from 'src/app/components/dialogs/bank/company/company-summary-dialog/company-summary-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { Region } from 'src/app/core/models/bank/setup/region';
import { District } from 'src/app/core/models/bank/setup/district';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { Customer } from 'src/app/core/models/bank/customer';
import { VendorDetailsReportTable } from 'src/app/core/enums/bank/reports/vendor-details-report-table';
import { ApproveCompanyInboxComponent } from 'src/app/components/dialogs/bank/company/approve-company-inbox/approve-company-inbox.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { CompanyApprovalForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-approval-form';
import { ApprovalService } from 'src/app/core/services/bank/company/inbox-approval/approval.service';
import { CompanyInboxListForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-inbox-list-form';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { VendorDetailsReportForm } from 'src/app/core/models/bank/forms/reports/vendor-details-report-form';
import { TableFormHeadersComponent } from 'src/app/reusables/table-form-headers/table-form-headers.component';
import { DashboardCompanySummaryTable } from 'src/app/core/enums/bank/company/company-summary-table';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    DashboardOverviewCardComponent,
    TranslocoModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    MatDialogModule,
    ReactiveFormsModule,
    ApproveCompanyInboxComponent,
    SuccessMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    TableFormHeadersComponent,
    MatTableModule,
    MatSortModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/dashboard', alias: 'dashboard' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class DashboardComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public transactionsLoading: boolean = false;
  public inboxApprovalLoading: boolean = false;
  public overviewLoading: boolean = false;
  public buildPageLoading: boolean = false;
  public invoiceStatistics: DashboardOverviewStatistic[] = [];
  public inboxApprovals: Company[] = [];
  public latestTransactions: TransactionDetail[] = [];
  public tableData: {
    tableCompanies: Company[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Company>;
  } = {
    tableCompanies: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Company>([]),
  };
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appconfig: AppConfigService,
    private tr: TranslocoService,
    private breadcrumbService: BreadcrumbService,
    private companyService: CompanyService,
    private approvalService: ApprovalService,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private router: Router,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        `dashboard.onboardCustomers.companySummary`,
        {},
        this.scope
      )
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
  private requestInboxApprovals() {
    this.inboxApprovalLoading = true;
    this.approvalService
      .postCompanyInboxList({
        design: this.getUserProfile().desig,
        braid: Number(this.getUserProfile().braid),
      } as CompanyInboxListForm)
      .then((results) => {
        if (
          typeof results.response !== 'string' &&
          typeof results.response !== 'number'
        ) {
          this.inboxApprovals = results.response;
        } else {
          this.inboxApprovals = [];
        }
        this.inboxApprovalLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.inboxApprovalLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private companyKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(DashboardCompanySummaryTable.NAME)) {
      keys.push('CompName');
    }
    if (indexes.includes(DashboardCompanySummaryTable.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(DashboardCompanySummaryTable.TIN_NUMBER)) {
      keys.push('TinNo');
    }
    if (indexes.includes(DashboardCompanySummaryTable.MOBILE_NUMBER)) {
      keys.push('MobNo');
    }
    if (indexes.includes(DashboardCompanySummaryTable.STATUS)) {
      keys.push('Status');
    }
    return keys;
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Company,
      filter: string
    ) => {
      return data.CompName.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.TinNo &&
          data.TinNo.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
        ? true
        : false;
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Company>(
      this.tableData.tableCompanies
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  public buildPage() {
    this.transactionsLoading = true;
    this.inboxApprovalLoading = true;
    this.overviewLoading = true;
    this.tableLoading = true;
    let approvalsObs = from(
      this.approvalService.postCompanyInboxList({
        design: this.getUserProfile().desig,
        braid: Number(this.getUserProfile().braid),
      } as CompanyInboxListForm)
    );
    let bankerInvoiceStatsObs = from(
      this.reportsService.getBankerInvoiceStats({
        sessB: this.getUserProfile().sessB,
      })
    );
    let compListObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.getUserProfile().braid,
      })
    );
    let latestTransactionsObs = from(
      this.reportsService.getLatestTransactionsList({})
    );
    let merged = zip(
      approvalsObs,
      bankerInvoiceStatsObs,
      compListObs,
      latestTransactionsObs
    );
    let res = AppUtilities.pipedObservables(merged);
    res
      .then((results) => {
        let [approvals, stats, compList, latestTransactions] = results;
        if (
          typeof approvals.response !== 'string' &&
          typeof approvals.response !== 'number'
        ) {
          this.inboxApprovals = approvals.response;
        }
        if (
          typeof stats.response !== 'string' &&
          typeof stats.response !== 'number'
        ) {
          this.invoiceStatistics = stats.response;
        }
        if (
          typeof compList.response !== 'string' &&
          typeof compList.response !== 'number'
        ) {
          this.tableData.tableCompanies = compList.response;
          this.prepareDataSource();
        }
        if (
          typeof latestTransactions.response !== 'string' &&
          typeof latestTransactions.response !== 'number'
        ) {
          this.latestTransactions = latestTransactions.response;
        }
        this.inboxApprovalLoading = false;
        this.overviewLoading = false;
        this.tableLoading = false;
        this.transactionsLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.inboxApprovalLoading = false;
        this.overviewLoading = false;
        this.tableLoading = false;
        this.transactionsLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.breadcrumbService.set('@dashboard', 'Child One');
    //this.buildPage();
  }
  getUserProfile() {
    return this.appconfig.getLoginResponse() as BankLoginResponse;
  }
  transactionsLatest(): any[] {
    let groupedByDate = this.latestTransactions.reduce((acc, obj) => {
      let paymentDate = PerformanceUtils.convertDateStringToDate(
        obj.Payment_Date
      );
      let date = paymentDate.toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(obj);
      return acc;
    }, {} as any);
    let results = Object.values(groupedByDate);
    results.forEach((arr: any) => {
      return arr.sort((a: any, b: any) => {
        let a1 = PerformanceUtils.convertDateStringToDate(a.Payment_Date);
        let b1 = PerformanceUtils.convertDateStringToDate(b.Payment_Date);
        return a1 < b1;
      });
    });
    return results;
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
  dateToFormat(date: string) {
    return new Date(date);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'CompName':
      case 'Email':
      case 'TinNo':
      case 'MobNo':
      case 'Status':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'CompName':
        return `${style} text-black font-semibold`;
      case 'Status':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.Status,
          'Approved',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} text-center w-fit`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.tableCompanies,
          element
        );
      default:
        return element[key];
    }
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  openEditCompanySummaryDialog(company: Company) {
    let dialogRef = this.dialog.open(CompanySummaryDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        companyData: company,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  approveCompany(dcompany: Company) {
    let dialogRef = this.dialog.open(ApproveCompanyInboxComponent, {
      width: '800px',
      disableClose: true,
      data: {
        company: dcompany,
      },
    });
    dialogRef.componentInstance.approved.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestInboxApprovals();
    });
  }
  determineDate(date: Date) {
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    let isToday = today.getTime() === date.getTime();
    let months: string[] = this.tr.translate(`utilities.months`);
    if (isToday) {
      let todayMsg = this.tr.translate(`utilities.today`);
      return todayMsg + ', ' + this.getDate(months, date);
    }
    let yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    let isYesterday = yesterday.getTime() === date.getTime();
    if (isYesterday) {
      let yesterdayMsg = this.tr.translate(`utilities.yesterday`);
      return yesterdayMsg + ', ' + this.getDate(months, date);
    }
    let days: { name: string; abbreviation: string }[] =
      this.tr.translate(`utilities.daysOfWeek`);
    return (
      days.at(date.getDay())?.abbreviation + ', ' + this.getDate(months, date)
    );
  }
  dashboardStatisticRouterLink(name: string) {
    switch (name.toLocaleLowerCase()) {
      case 'Transaction'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/transactions'], {
          queryParams: { q: btoa(name) },
        });
        break;
      case 'Vendor'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/vendors'], {
          queryParams: { q: btoa(name) },
        });
        break;
      case 'Users'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/userlog']);
        break;
      case 'Pendings'.toLocaleLowerCase():
        this.router.navigate(['/main/company/inbox']);
        break;
      case 'Customers'.toLocaleLowerCase():
        this.router.navigate(['/main/reports/customer'], {
          queryParams: { q: btoa(name) },
        });
        break;
      default:
        this.router.navigate(['/main']);
        break;
    }
  }
  invoiceNumberToBase64(invoice_number: string) {
    return btoa(invoice_number);
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
