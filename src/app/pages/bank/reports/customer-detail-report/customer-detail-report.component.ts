import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import {
  Observable,
  TimeoutError,
  catchError,
  from,
  lastValueFrom,
  map,
  toArray,
  zip,
} from 'rxjs';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Company } from 'src/app/core/models/bank/company/company';
import { Region } from 'src/app/core/models/bank/setup/region';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { District } from 'src/app/core/models/bank/setup/district';
import { Customer } from 'src/app/core/models/bank/customer';
import { VendorDetailsReportTable } from 'src/app/core/enums/bank/reports/vendor-details-report-table';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { LoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-customer-detail-report',
  templateUrl: './customer-detail-report.component.html',
  styleUrls: ['./customer-detail-report.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class CustomerDetailReportComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  //public companies: Company[] = [];
  //public regions: Region[] = [];
  //public districts: District[] = [];
  public userProfile!: LoginResponse;
  public filterFormData: {
    companies: Company[];
    regions: Region[];
    districts: District[];
    branches: Branch[];
  } = {
    companies: [],
    regions: [],
    districts: [],
    branches: [],
  };
  public customers: Customer[] = [];
  public customersData: Customer[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public VendorDetailsReportTable: typeof VendorDetailsReportTable =
    VendorDetailsReportTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private companyService: CompanyService,
    private branchService: BranchService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    private tr: TranslocoService,
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
      Comp: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.userProfile.braid, []),
      reg: this.fb.control('', [Validators.required]),
      dist: this.fb.control('', [Validators.required]),
    });
    this.regionChangeEventHandler();
  }
  private async createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `customerDetailReport.customerDetailReportTable`,
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
  private fetchDistricts(body: { Sno: string }) {
    this.startLoading = true;
    this.companyService
      .getDistrictList(body)
      .then((results: any) => {
        this.startLoading = false;
        if (typeof results.response === 'number') {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.warning`),
            this.tr.translate(
              `reports.customerDetailReport.form.errors.dialog.noDistrictForRegion`
            )
          );
        }
        this.filterFormData.districts =
          typeof results.response === 'number' ? [] : results.response;
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
  private regionChangeEventHandler() {
    this.reg.valueChanges.subscribe((value) => {
      let index = this.filterFormData.regions.find(
        (r) => r.Region_SNO === Number(value)
      );
      if (index) {
        this.fetchDistricts({ Sno: value });
      } else {
        this.filterFormData.districts = [];
      }
    });
  }
  private async buildPage() {
    this.startLoading = true;
    let companiesObs = from(this.reportsService.getCompaniesList({}));
    let regionsObs = from(this.companyService.getRegionList());
    let branchesObs = from(this.branchService.postBranchList({}));
    let mergedObservable = zip(companiesObs, regionsObs, branchesObs);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [companies, regions, branches] = results;
        // this.filterFormData.companies = companies.response === 0 ? [] : companies.response;
        // this.filterFormData.regions = regions.response === 0 ? [] : regions.response;
        if (
          typeof companies.response !== 'number' &&
          typeof companies.response !== 'string'
        ) {
          this.filterFormData.companies = companies.response;
        }
        if (
          typeof regions.response !== 'number' &&
          typeof regions.response !== 'string'
        ) {
          this.filterFormData.regions = regions.response;
        }
        if (
          typeof branches.response !== 'number' &&
          typeof branches.response !== 'string'
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
  private formErrors(
    errorsPath: string = 'reports.customerDetailReport.form.errors.dialog'
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
  private sortTableAsc(ind: number) {
    switch (ind) {
      case VendorDetailsReportTable.CUSTOMER_NAME:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Cust_Name.toLocaleLowerCase() > b.Cust_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorDetailsReportTable.PHONE:
        this.customers.sort((a: Customer, b: Customer) =>
          a?.ConPerson?.toLocaleLowerCase() > b?.ConPerson?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorDetailsReportTable.EMAIL:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Email.toLocaleLowerCase() > b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorDetailsReportTable.ADDRESS:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Address.toLocaleLowerCase() > b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorDetailsReportTable.DATE_POSTED:
        this.customers.sort((a: Customer, b: Customer) =>
          new Date(a.Posted_Date) > new Date(b.Posted_Date) ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case VendorDetailsReportTable.CUSTOMER_NAME:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Cust_Name.toLocaleLowerCase() < b.Cust_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorDetailsReportTable.PHONE:
        this.customers.sort((a: Customer, b: Customer) =>
          a?.ConPerson?.toLocaleLowerCase() < b?.ConPerson?.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case VendorDetailsReportTable.EMAIL:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Email.toLocaleLowerCase() < b.Email.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorDetailsReportTable.ADDRESS:
        this.customers.sort((a: Customer, b: Customer) =>
          a.Address.toLocaleLowerCase() < b.Address.toLocaleLowerCase() ? 1 : -1
        );
        break;
      case VendorDetailsReportTable.DATE_POSTED:
        this.customers.sort((a: Customer, b: Customer) =>
          new Date(a.Posted_Date) < new Date(b.Posted_Date) ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private requestCustomerDetails(form: any) {
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
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.customerKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let keys = this.getActiveTableKeys();
      let text = searchText.trim().toLowerCase();
      this.customers = this.customersData.filter((customer: any) => {
        return keys.some((key) => customer[key]?.toLowerCase().includes(text));
      });
    } else {
      this.customers = this.customersData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.createTableFilterForm();
  }
  submitTableFilterForm() {
    if (!this.tableFilterFormGroup.valid) {
      this.formErrors();
      return;
    }
    this.customersData = [];
    this.customers = this.customersData;
    this.requestCustomerDetails(this.tableFilterFormGroup.value);
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  dateToFormat(date: string) {
    return new Date(date);
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  downloadSheet() {
    if (this.customersData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.customersData,
        this.getActiveTableKeys(),
        'vendors_report',
        ['Posted_Date']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  get Comp() {
    return this.tableFilterFormGroup.get('Comp') as FormControl;
  }
  get reg() {
    return this.tableFilterFormGroup.get('reg') as FormControl;
  }
  get dist() {
    return this.tableFilterFormGroup.get('dist') as FormControl;
  }
  get branch() {
    return this.tableFilterFormGroup.get('branch') as FormControl;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
