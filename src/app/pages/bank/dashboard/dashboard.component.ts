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
import { LoginResponse } from 'src/app/core/models/login-response';
import { TimeoutError, catchError, from, lastValueFrom, map, zip } from 'rxjs';
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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/dashboard', alias: 'dashboard' },
    },
  ],
})
export class DashboardComponent implements OnInit {
  private userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public inboxApprovalLoading: boolean = false;
  public overviewLoading: boolean = false;
  public invoiceStatistics: DashboardOverviewStatistic[] = [];
  public inboxApprovals: Company[] = [];
  public companies: Company[] = [];
  public tableCompanies: Company[] = [];
  public tableCompaniesData: Company[] = [];
  public latestTransactions: TransactionDetail[] = [];
  public DashboardCompanySummaryTable: typeof DashboardCompanySummaryTable =
    DashboardCompanySummaryTable;
  //public transactions: any[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
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
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private sortTableAsc(index: number) {
    switch (index) {
      case DashboardCompanySummaryTable.NAME:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() > b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DashboardCompanySummaryTable.EMAIL:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.Email.toLocaleLowerCase() > b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case DashboardCompanySummaryTable.TIN_NUMBER:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() > b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case DashboardCompanySummaryTable.MOBILE_NUMBER:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() > b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case DashboardCompanySummaryTable.STATUS:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a?.Status?.toLocaleLowerCase() > b?.Status?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(index: number) {
    switch (index) {
      case DashboardCompanySummaryTable.NAME:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() < b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case DashboardCompanySummaryTable.EMAIL:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.Email.toLocaleLowerCase() < b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case DashboardCompanySummaryTable.TIN_NUMBER:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() < b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case DashboardCompanySummaryTable.MOBILE_NUMBER:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() < b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case DashboardCompanySummaryTable.STATUS:
        this.tableCompanies.sort((a: Company, b: Company) =>
          a?.Status?.toLocaleLowerCase() < b?.Status?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `dashboard.onboardCustomers.companySummary`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private requestCompanyList() {
    this.tableLoading = true;
    this.companyService
      .getCustomersList({})
      .then((result) => {
        if (
          typeof result.response === 'number' ||
          typeof result.response === 'string'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
        } else {
          this.tableCompaniesData = result.response;
          this.tableCompanies = this.tableCompaniesData;
        }
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
        throw err;
      });
  }
  private requestInboxApprovals() {
    this.inboxApprovalLoading = true;
    this.approvalService
      .postCompanyInboxList({
        design: this.userProfile.desig,
        braid: Number(this.userProfile.braid),
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
  private requestBankerInvoiceStats() {
    this.overviewLoading = true;
    this.reportsService
      .getBankerInvoiceStats({ sessB: this.userProfile.sessb })
      .then((result) => {
        if (typeof result === 'string' && typeof result === 'number') {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`dashboard.dashboard.invoiceData.message`)
          );
        } else {
          this.invoiceStatistics =
            result.response as DashboardOverviewStatistic[];
        }
        this.overviewLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.overviewLoading = false;
        this.cdr.detectChanges();
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let text = searchText.trim().toLowerCase(); // Use toLowerCase() instead of toLocalLowercase()
      let keys = this.companyKeys(indexes);
      this.tableCompanies = this.tableCompanies.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.tableCompanies = this.tableCompaniesData;
    }
  }
  public buildPage() {
    this.inboxApprovalLoading = true;
    this.overviewLoading = true;
    this.tableLoading = true;
    let approvalsObs = from(
      this.approvalService.postCompanyInboxList({
        design: this.userProfile.desig,
        braid: Number(this.userProfile.braid),
      } as CompanyInboxListForm)
    );
    let bankerInvoiceStatsObs = from(
      this.reportsService.getBankerInvoiceStats({
        sessB: this.userProfile.sessb,
      })
    );
    let compListObs = from(this.companyService.getLatestCompanies({}));
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
          this.tableCompaniesData = compList.response;
          this.tableCompanies = this.tableCompaniesData;
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
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.breadcrumbService.set('@dashboard', 'Child One');
    this.buildPage();
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
