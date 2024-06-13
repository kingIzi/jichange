import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { from, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { VendorReportTable } from 'src/app/core/enums/bank/reports/vendor-report-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { LoginResponse } from 'src/app/core/models/login-response';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-vendor-detail-report',
  standalone: true,
  templateUrl: './vendor-detail-report.component.html',
  styleUrl: './vendor-detail-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    CommonModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    MatPaginatorModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class VendorDetailReportComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public userProfile!: LoginResponse;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public VendorReportTable: typeof VendorReportTable = VendorReportTable;
  public companies: Company[] = [];
  public companiesData: Company[] = [];
  public filterFormData: {
    branches: Branch[];
  } = {
    branches: [],
  };
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private branchService: BranchService,
    private reportsService: ReportsService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableFilterForm() {
    this.tableFilterFormGroup = this.fb.group({
      branch: this.fb.control(this.userProfile.braid, []),
    });
    if (Number(this.userProfile.braid) > 0) {
      this.branch.disable();
    }
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `vendorReport.vendorReportTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      7,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private buildPage() {
    this.startLoading = true;
    let branchesObs = from(this.branchService.postBranchList({}));
    let merged = zip(branchesObs);
    let res = AppUtilities.pipedObservables(merged);
    res
      .then((results) => {
        let [branches] = results;
        if (
          typeof branches.response !== 'string' &&
          typeof branches.response !== 'number'
        ) {
          this.filterFormData.branches = branches.response;
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private emptyCompanies() {
    this.companiesData = [];
    this.companies = this.companiesData;
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.emptyCompanies();
    this.tableLoading = true;
    this.reportsService
      .getBranchedCompanyList(body)
      .then((result) => {
        if (
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.companiesData = result.response;
          this.companies = this.companiesData;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
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
  private sortTableAsc(ind: number) {
    switch (ind) {
      case VendorReportTable.VENDOR_NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() > b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorReportTable.MOBILE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() > b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorReportTable.TIN_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() > b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorReportTable.ACCOUNT_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.AccountNo.toLocaleLowerCase() > b.AccountNo.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorReportTable.STATUS:
        this.companies.sort((a: Company, b: Company) =>
          a.Status.toLocaleLowerCase() > b.Status.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorReportTable.CHECKER:
        this.companies.sort((a: Company, b: Company) =>
          a.Checker.toLocaleLowerCase() > b.Checker.toLocaleLowerCase() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case VendorReportTable.VENDOR_NAME:
        this.companies.sort((a: Company, b: Company) =>
          a.CompName.toLocaleLowerCase() < b.CompName.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorReportTable.MOBILE_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.MobNo.toLocaleLowerCase() < b.MobNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorReportTable.TIN_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.TinNo.toLocaleLowerCase() < b.TinNo.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorReportTable.ACCOUNT_NUMBER:
        this.companies.sort((a: Company, b: Company) =>
          a.AccountNo.toLocaleLowerCase() < b.AccountNo.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorReportTable.STATUS:
        this.companies.sort((a: Company, b: Company) =>
          a.Status.toLocaleLowerCase() < b.Status.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorReportTable.CHECKER:
        this.companies.sort((a: Company, b: Company) =>
          a.Checker.toLocaleLowerCase() < b.Checker.toLocaleLowerCase() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private companyKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(VendorReportTable.VENDOR_NAME)) {
      keys.push('CompName');
    }
    if (indexes.includes(VendorReportTable.MOBILE_NUMBER)) {
      keys.push('MobNo');
    }
    if (indexes.includes(VendorReportTable.TIN_NUMBER)) {
      keys.push('TinNo');
    }
    if (indexes.includes(VendorReportTable.ACCOUNT_NUMBER)) {
      keys.push('AccountNo');
    }
    if (indexes.includes(VendorReportTable.STATUS)) {
      keys.push('Status');
    }
    if (indexes.includes(VendorReportTable.CHECKER)) {
      keys.push('Checker');
    }
    return keys;
  }
  private getTableActiveKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.companyKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.trim().toLowerCase();
      let keys = this.getTableActiveKeys();
      this.companies = this.companiesData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.companies = this.companiesData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableFilterForm();
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['q']) {
        let q = atob(params['q']);
        this.submitTableFilterForm();
      }
    });
  }
  submitTableFilterForm() {
    let form = {} as any;
    form.branch = this.branch.value;
    this.requestCompaniesList(form);
  }
  get branch() {
    return this.tableFilterFormGroup.get(`branch`) as FormControl;
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
