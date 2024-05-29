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
import { RouterModule } from '@angular/router';
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
//import * as json from 'src/assets/temp/data.json';
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
import { BankInvoiceData } from 'src/app/core/models/bank/reports/bank-invoice-data';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/dashboard', alias: 'dashboard' },
    },
  ],
})
export class DashboardComponent implements OnInit {
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
      label: 'Pending',
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
  private userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public inboxApprovalLoading: boolean = false;
  public overviewLoading: boolean = false;
  public bankInvoiceData!: BankInvoiceData;
  public inboxApprovals: Company[] = [];
  public companies: Company[] = [];
  public regions: Region[] = [];
  public districts: District[] = [];
  public customers: Customer[] = [];
  public customersData: Customer[] = [];
  public transactions: any[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public vendorReportForm!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public VendorDetailsReportTable: typeof VendorDetailsReportTable =
    VendorDetailsReportTable;
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
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createVendorReportForm() {
    this.vendorReportForm = this.fb.group({
      Comp: this.fb.control('0', [Validators.required]),
      reg: this.fb.control('0', [Validators.required]),
      dist: this.fb.control('0', [Validators.required]),
    });
    this.regionChangeEventHandler();
  }
  private formErrors(
    errorsPath: string = 'dashboard.dashboard.customerDetailReport.form.errors.dialog'
  ) {
    if (this.Comp.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.company`)
      );
    }
    if (this.reg.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.region`)
      );
    }
    if (this.dist.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.district`)
      );
    }
  }
  private sortTableAsc(index: number) {
    switch (index) {
      case VendorDetailsReportTable.CUSTOMER_NAME:
        this.customers.sort((a, b) => (a.Cust_Name > b.Cust_Name ? 1 : -1));
        break;
      case VendorDetailsReportTable.PHONE:
        this.customers.sort((a, b) => (a.ConPerson > b.ConPerson ? 1 : -1));
        break;
      case VendorDetailsReportTable.EMAIL:
        this.customers.sort((a, b) => (a.Email > b.Email ? 1 : -1));
        break;
      case VendorDetailsReportTable.ADDRESS:
        this.customers.sort((a, b) => (a.Address > b.Address ? 1 : -1));
        break;
      default:
        break;
    }
  }
  private sortTableDesc(index: number) {
    switch (index) {
      case VendorDetailsReportTable.CUSTOMER_NAME:
        this.customers.sort((a, b) => (a.Cust_Name < b.Cust_Name ? 1 : -1));
        break;
      case VendorDetailsReportTable.PHONE:
        this.customers.sort((a, b) => (a.ConPerson < b.ConPerson ? 1 : -1));
        break;
      case VendorDetailsReportTable.EMAIL:
        this.customers.sort((a, b) => (a.Email < b.Email ? 1 : -1));
        break;
      case VendorDetailsReportTable.ADDRESS:
        this.customers.sort((a, b) => (a.Address < b.Address ? 1 : -1));
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
      `dashboard.customerDetailReport.customerDetailReportTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchVendorDetailTable(value, this.paginator);
    });
  }
  private fetchDistricts(body: { Sno: string }) {
    this.companyService
      .getDistrictList(body)
      .then((results: any) => {
        if (typeof results.response === 'number') {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.warning`),
            this.tr.translate(
              `reports.customerDetailReport.form.errors.dialog.noDistrictForRegion`
            )
          );
        }
        this.districts =
          typeof results.response === 'number' ? [] : results.response;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  private async buildPage() {
    let companiesObservable = from(this.reportsService.getCompaniesList({}));
    let regionsObservable = from(this.companyService.getRegionList());
    let mergedObservable = zip(companiesObservable, regionsObservable);
    let res = lastValueFrom(
      mergedObservable.pipe(
        map((result) => {
          return result;
        }),
        catchError((err) => {
          throw err;
        })
      )
    );
    res
      .then((results: Array<any>) => {
        let [companies, regions] = results;
        this.companies = companies.response === 0 ? [] : companies.response;
        this.regions = regions.response === 0 ? [] : regions.response;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  private regionChangeEventHandler() {
    this.reg.valueChanges.subscribe((value) => {
      let index = this.regions.find((r) => r.Region_SNO === Number(value));
      if (index) {
        this.fetchDistricts({ Sno: value });
      } else {
        this.districts = [];
      }
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
  private requestCustomerDetails(form: VendorDetailsReportForm) {
    this.customersData = [];
    this.customers = this.customersData;
    this.tableLoading = true;
    this.reportsService
      .postCustomerDetailsReport(form)
      .then((results) => {
        if (
          typeof results.response !== 'string' &&
          typeof results.response !== 'number'
        ) {
          this.customersData = results.response;
          this.customers = this.customersData;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`defaults.errors.noDataFound`)
          );
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
          this.bankInvoiceData = result as BankInvoiceData;
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
  private customerKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(VendorDetailsReportTable.CUSTOMER_NAME)) {
      keys.push('Cust_Name');
    }
    if (indexes.includes(VendorDetailsReportTable.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(VendorDetailsReportTable.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(VendorDetailsReportTable.PHONE)) {
      keys.push('ConPerson');
    }
    return keys;
  }
  private searchVendorDetailTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let indexes = this.headers.controls
        .map((control, index) => {
          return control.get('included')?.value ? index : -1;
        })
        .filter((num) => num !== -1);
      let keys = this.customerKeys(indexes);
      let text = searchText.trim().toLowerCase();
      this.customers = this.customersData.filter((customer: any) => {
        return keys.some((key) => customer[key]?.toLowerCase().includes(text));
      });
    } else {
      this.customers = this.customersData;
    }
  }
  ngOnInit(): void {
    this.createVendorReportForm();
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.breadcrumbService.set('@dashboard', 'Child One');
    this.requestInboxApprovals();
    this.requestCustomerDetails(this.vendorReportForm.value);
    this.requestBankerInvoiceStats();
  }
  transactionsLatest(): any[] {
    let groupedByDate = this.transactions.reduce((acc, obj) => {
      let jsDate = AppUtilities.convertDotNetJsonDateToDate(obj.date);
      let date = AppUtilities.dateToFormat(jsDate, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(obj);
      return acc;
    }, {});
    let results = Object.values(groupedByDate);
    results.forEach((arr: any) => {
      return arr.sort((a: any, b: any) => {
        let a1 = AppUtilities.convertDotNetJsonDateToDate(a.date.toString());
        let b1 = AppUtilities.convertDotNetJsonDateToDate(b.date.toString());
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
  submitTableFilterForm() {
    if (this.vendorReportForm.valid) {
      this.requestCustomerDetails(this.vendorReportForm.value);
    } else {
      this.vendorReportForm.markAllAsTouched();
    }
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
  get Comp() {
    return this.vendorReportForm.get('Comp') as FormControl;
  }
  get reg() {
    return this.vendorReportForm.get('reg') as FormControl;
  }
  get dist() {
    return this.vendorReportForm.get('dist') as FormControl;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
