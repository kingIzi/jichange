import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
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
import * as json from 'src/assets/temp/data.json';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company';
import { CompanyService } from 'src/app/core/services/bank/company/company.service';
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
import { Region } from 'src/app/core/models/bank/region';
import { District } from 'src/app/core/models/bank/district';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { Customer } from 'src/app/core/models/bank/customer';
import { VendorDetailsReportTable } from 'src/app/core/enums/bank/vendor-details-report-table';
import { ApproveCompanyInboxComponent } from 'src/app/components/dialogs/bank/company/approve-company-inbox/approve-company-inbox.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';

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
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    MatDialogModule,
    ReactiveFormsModule,
    ApproveCompanyInboxComponent,
    SuccessMessageBoxComponent,
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
  private userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public inboxApprovalLoading: boolean = false;
  public inboxApprovals: Company[] = [];
  public companies: Company[] = [];
  public regions: Region[] = [];
  public districts: District[] = [];
  public customers: Customer[] = [];
  public customersData: Customer[] = [];
  public transactions: any[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public vendorReportForm!: FormGroup;
  public headersMap = {
    CUSTOMER_NAME: VendorDetailsReportTable.CUSTOMER_NAME,
    CONTACT_PERSON: VendorDetailsReportTable.CONTACT_PERSON,
    EMAIL: VendorDetailsReportTable.EMAIL,
    ADDRESS: VendorDetailsReportTable.ADDRESS,
    DATE_POSTED: VendorDetailsReportTable.DATE_POSTED,
  };
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private tr: TranslocoService,
    private breadcrumbService: BreadcrumbService,
    private companyService: CompanyService,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private fb: FormBuilder,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createVendorReportForm() {
    this.vendorReportForm = this.fb.group({
      Comp: this.fb.control('', [Validators.required]),
      reg: this.fb.control('', [Validators.required]),
      dist: this.fb.control('', [Validators.required]),
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
      case this.headersMap.CUSTOMER_NAME:
        this.customers.sort((a, b) => (a.Cust_Name > b.Cust_Name ? 1 : -1));
        break;
      case this.headersMap.CONTACT_PERSON:
        this.customers.sort((a, b) => (a.ConPerson > b.ConPerson ? 1 : -1));
        break;
      case this.headersMap.EMAIL:
        this.customers.sort((a, b) => (a.Email > b.Email ? 1 : -1));
        break;
      case this.headersMap.ADDRESS:
        this.customers.sort((a, b) => (a.Address > b.Address ? 1 : -1));
        break;
      default:
        break;
    }
  }
  private sortTableDesc(index: number) {
    switch (index) {
      case this.headersMap.CUSTOMER_NAME:
        this.customers.sort((a, b) => (a.Cust_Name < b.Cust_Name ? 1 : -1));
        break;
      case this.headersMap.CONTACT_PERSON:
        this.customers.sort((a, b) => (a.ConPerson < b.ConPerson ? 1 : -1));
        break;
      case this.headersMap.EMAIL:
        this.customers.sort((a, b) => (a.Email < b.Email ? 1 : -1));
        break;
      case this.headersMap.ADDRESS:
        this.customers.sort((a, b) => (a.Address < b.Address ? 1 : -1));
        break;
      default:
        break;
    }
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.tr
      .selectTranslate(
        'dashboard.customerDetailReport.customerDetailReportTable',
        {},
        this.scope
      )
      .subscribe((labels: string[]) => {
        labels.forEach((label, index) => {
          let header = this.fb.group({
            label: this.fb.control(label, []),
            sortAsc: this.fb.control(false, []),
            included: this.fb.control(index < 5, []),
            values: this.fb.array([], []),
          });
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
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
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
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
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
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private requestInboxApprovals() {
    this.inboxApprovalLoading = true;
    this.companyService
      .postCompanyInboxList({
        design: this.userProfile.desig,
        braid: Number(this.userProfile.braid),
      })
      .then((results: any) => {
        this.inboxApprovalLoading = false;
        this.inboxApprovals = results.response === 0 ? [] : results.response;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.inboxApprovalLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private requestCustomerDetails(form: any) {
    this.customersData = [];
    this.customers = this.customersData;
    this.tableLoading = true;
    this.reportsService
      .postCustomerDetailsReport(form)
      .then((results: any) => {
        this.tableLoading = false;
        this.customersData = results.response === 0 ? [] : results.response;
        this.customers = this.customersData;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private customerKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(this.headersMap.CUSTOMER_NAME)) {
      keys.push('Cust_Name');
    }
    if (indexes.includes(this.headersMap.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(this.headersMap.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(this.headersMap.CONTACT_PERSON)) {
      keys.push('ConPerson');
    }
    return keys;
  }
  private companyApprovedSuccessullyMessage() {
    let dialog = AppUtilities.openSuccessMessageBox(
      this.successMessageBox,
      this.tr.translate(`company.summary.actions.approvedCompanySuccessfully`)
    );
  }
  private failedToApproveCompanyMessage() {
    let dialog = AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`defaults.failed`),
      this.tr.translate(
        `company.summary.companyForm.dialogs.failedToApproveCompany`
      )
    );
  }
  private requestApproveCompany(value: {
    compsno: number;
    pfx: string;
    ssno: string;
    userid: number;
  }) {
    this.startLoading = true;
    this.companyService
      .approveCompany(value)
      .then((results: any) => {
        this.startLoading = false;
        if (results.response === 0 || typeof results.response !== 'number') {
          this.failedToApproveCompanyMessage();
        } else {
          this.companyApprovedSuccessullyMessage();
        }
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.createVendorReportForm();
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.breadcrumbService.set('@dashboard', 'Child One');
    let data = JSON.parse(JSON.stringify(json));
    this.transactions = data.transactionDetails;
    this.requestInboxApprovals();
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
    if (!this.vendorReportForm.valid) {
      this.formErrors();
      return;
    }
    this.requestCustomerDetails(this.vendorReportForm.value);
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
  approveCompany(dialog: ApproveCompanyInboxComponent, company: Company) {
    let payload: {
      compsno: number;
      pfx: string;
      ssno: string;
      userid: number;
    } = {
      compsno: company.CompSno,
      pfx: '',
      ssno: '',
      userid: this.userProfile.Usno,
    };
    let dialogRef = dialog.openDialog();
    dialog.close.asObservable().subscribe(() => {
      dialogRef.close();
    });
    dialog.approve.asObservable().subscribe(() => {
      this.requestApproveCompany(payload);
      dialogRef.close();
    });
  }
  searchTable(searchText: string, paginator: MatPaginator) {
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
}
