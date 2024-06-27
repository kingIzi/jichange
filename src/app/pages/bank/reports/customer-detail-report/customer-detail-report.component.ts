import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  of,
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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';

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
    MatTableModule,
    MatSortModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class CustomerDetailReportComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
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
  public tableData: {
    customers: Customer[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Customer>;
  } = {
    customers: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Customer>([]),
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public VendorDetailsReportTable: typeof VendorDetailsReportTable =
    VendorDetailsReportTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private companyService: CompanyService,
    private branchService: BranchService,
    private fileHandler: FileHandlerService,
    private activatedRoute: ActivatedRoute,
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
    if (Number(this.userProfile.braid) > 0) {
      this.branch.disable();
    }
    if (Number(this.userProfile.braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.regionChangeEventHandler();
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        `customerDetailReport.customerDetailReportTable`,
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
  private branchChangedEventHandler() {
    this.branch.valueChanges.subscribe((value) => {
      this.requestCompaniesList({ branch: value });
    });
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.startLoading = true;
    this.reportsService
      .getBranchedCompanyList(body)
      .then((result) => {
        if (
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.filterFormData.companies = result.response;
        } else {
          this.filterFormData.companies = [];
          this.Comp.setValue('all');
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr
              .translate(`reports.customerDetailReport.noVendorsFoundInBranch`)
              .replace(
                '{}',
                this.filterFormData.branches.find(
                  (b) => b.Branch_Sno.toString() === this.branch.value
                )?.Name as string
              )
          );
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
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.userProfile.braid,
      })
    );
    let regionsObs = from(this.companyService.getRegionList());
    let branchesObs = from(this.branchService.postBranchList({}));
    let mergedObservable = zip(companiesObs, regionsObs, branchesObs);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [companies, regions, branches] = results;
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Customer,
      filter: string
    ) => {
      return data.Cust_Name.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Email &&
          data.Email.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
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
        case 'Posted_Date':
          return new Date(item['Due_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Customer>(
      this.tableData.customers
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private assignCustomersDataList(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.tableData.customers = result.response;
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr.translate(
          `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
        )
      );
      this.tableData.customers = [];
    }
    this.prepareDataSource();
  }
  private requestCustomerDetails(form: any) {
    this.tableData.customers = [];
    this.prepareDataSource();
    this.tableLoading = true;
    this.reportsService
      .postCustomerDetailsReport(form)
      .then((result) => {
        this.assignCustomersDataList(result);
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
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  private initData(q: string) {
    if (q.toLocaleLowerCase() === 'Customers'.toLocaleLowerCase()) {
      this.Comp.setValue('0');
      this.reg.setValue('0');
      this.dist.setValue('0');
      this.submitTableFilterForm();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.createTableFilterForm();
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['q']) {
        let q = atob(params['q']);
        this.initData(q);
      }
    });
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Posted_Date':
      case 'Cust_Name':
      case 'Phone':
      case 'Email':
      case 'Address':
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
      case 'Cust_Name':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.customers,
          element
        );
      case 'Posted_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      default:
        return element[key] ? element[key] : '-';
    }
  }
  submitTableFilterForm() {
    if (this.tableFilterFormGroup.valid) {
      let form = { ...this.tableFilterFormGroup.value };
      form.branch = this.branch.value;
      this.requestCustomerDetails(form);
    } else {
      this.tableFilterFormGroup.markAllAsTouched();
    }
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
    if (this.tableData.customers.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.tableData.customers,
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
