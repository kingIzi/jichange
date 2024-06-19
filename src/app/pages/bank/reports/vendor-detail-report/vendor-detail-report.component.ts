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
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Observable, from, of, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { VendorReportTable } from 'src/app/core/enums/bank/reports/vendor-report-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
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
    MatTableModule,
    MatSortModule,
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
  public tableData: {
    companies: Company[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Company>;
  } = {
    companies: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Company>([]),
  };
  public filterFormData: {
    branches: Branch[];
  } = {
    branches: [],
  };
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
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
    let TABLE_SHOWING = 7;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`vendorReport.vendorReportTable`, {}, this.scope)
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Company,
      filter: string
    ) => {
      return data.CompName.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      );
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Company>(
      this.tableData.companies
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.tableData.companies = [];
    this.tableLoading = true;
    this.reportsService
      .getBranchedCompanyList(body)
      .then((result) => {
        if (
          typeof result.response === 'string' &&
          typeof result.response === 'number'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.companies = [];
          this.prepareDataSource();
        } else if (
          result.response instanceof Array &&
          result.response.length === 0
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.companies = [];
          this.prepareDataSource();
        } else {
          this.tableData.companies = result.response as Company[];
          this.prepareDataSource();
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
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
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
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'CompName':
      case 'MobNo':
      case 'TinNo':
      case 'AccountNo':
      case 'Status':
      case 'Checker':
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
    let Checker = (value: string) => {
      if (!value) return `text-black font-normal`;
      return value.toLocaleLowerCase() === 'no'
        ? `text-red-600`
        : `text-green-600`;
    };
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'CompName':
        return `${style} text-black font-semibold`;
      case 'Status':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.Status,
          'Approved'
        )} w-fit`;
      case 'Checker':
        return Checker(element[key]);
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.companies,
          element
        );
      default:
        return element[key] ? element[key] : '-';
    }
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
