import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  Validators,
} from '@angular/forms';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { TablePaginationComponent } from 'src/app/components/table-pagination/table-pagination.component';
import { AuditTrail } from 'src/app/core/models/bank/reports/auditTrail';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { formatDate } from '@angular/common';
import { AuditTrailsService } from 'src/app/core/services/bank/reports/audit-trails/audit-trails.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { Observable, TimeoutError, from, of, zip } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { AuditTrailsTable } from 'src/app/core/enums/bank/reports/audit-trails-table';
import { AuditTrailsReportForm } from 'src/app/core/models/bank/forms/reports/audit-trails-report-form';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { LoginResponse } from 'src/app/core/models/login-response';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

@Component({
  selector: 'app-audit-trails',
  templateUrl: './audit-trails.component.html',
  styleUrls: ['./audit-trails.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    TableDateFiltersComponent,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    TablePaginationComponent,
    MatPaginatorModule,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditTrailsComponent implements OnInit {
  public selectPageOptions: string[] = [
    'Country',
    'Region',
    'District',
    'Ward',
    'Designation',
    'Currency',
    'Email Text',
    'Smtp Settings',
    'Bank User',
    'Questions',
    'Vat Percentage',
    'Company',
  ];
  public actions: string[] = ['All', 'Insert', 'Update', 'Delete'];
  public formGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public branches: Branch[] = [];
  public tableData: {
    auditTrails: AuditTrail[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<AuditTrail>;
  } = {
    auditTrails: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<AuditTrail>([]),
  };
  public headersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private auditTrailsService: AuditTrailsService,
    private fileHandler: FileHandlerService,
    private branchService: BranchService,
    private cdf: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createHeadersGroup() {
    let TABLE_SHOWING = 7;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`auditTrails.auditTrailsTable`, {}, this.scope)
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
  private createForm() {
    this.formGroup = this.fb.group({
      tbname: this.fb.control(this.selectPageOptions[0], [Validators.required]),
      Startdate: this.fb.control('', [Validators.required]),
      Enddate: this.fb.control('', [Validators.required]),
      act: this.fb.control(this.actions[0], [Validators.required]),
      branch: this.fb.control(this.userProfile.braid, []),
    });
    if (Number(this.userProfile.braid) > 0) {
      this.branch.disable();
    }
  }
  private formErrors(
    errorsPath: string = 'reports.auditTrails.form.errors.dialog'
  ) {
    if (this.tbname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.selectPage`)
      );
    }
    if (this.act.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.action`)
      );
    }
    if (this.Startdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.validDate`)
      );
    }
    if (this.Enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.validDate`)
      );
    }
  }
  private reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${date}/${month}/${year}`;
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: AuditTrail,
      filter: string
    ) => {
      return data.atype
        .toLocaleLowerCase()
        .includes(filter.toLocaleLowerCase());
    };
  }
  private dataSourceSortingAccessor() {
    this.tableData.dataSource.sortingDataAccessor = (
      item: any,
      property: string
    ) => {
      switch (property) {
        case 'adate':
          return new Date(item['adate']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<AuditTrail>(
      this.tableData.auditTrails
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private assignAuditTrailsDataList(
    result: HttpDataResponse<string | number | AuditTrail[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.tableData.auditTrails = result.response;
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr.translate(`reports.auditTrails.noAuditTrailsFound`)
      );
      this.tableData.auditTrails = [];
    }
    this.prepareDataSource();
  }
  private filterAuditTrailsRequest(value: AuditTrailsReportForm) {
    this.tableData.auditTrails = [];
    this.prepareDataSource();
    this.tableLoading = true;
    this.auditTrailsService
      .getDetails(value)
      .then((result) => {
        this.assignAuditTrailsDataList(result);
        this.tableLoading = false;
        this.cdf.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdf.detectChanges();
        throw err;
      });
  }
  private audiTrailKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(AuditTrailsTable.ACTIONS)) {
      keys.push('atype');
    }
    if (indexes.includes(AuditTrailsTable.COLUMN_NAME)) {
      keys.push('colname');
    }
    if (indexes.includes(AuditTrailsTable.OLD_VALUE)) {
      keys.push('ovalue');
    }
    if (indexes.includes(AuditTrailsTable.NEW_VALUE)) {
      keys.push('nvalue');
    }
    if (indexes.includes(AuditTrailsTable.NEW_VALUE)) {
      keys.push('nvalue');
    }
    if (indexes.includes(AuditTrailsTable.POSTED)) {
      keys.push('aby');
    }
    if (indexes.includes(AuditTrailsTable.AUDIT_DATE)) {
      keys.push('adate');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.audiTrailKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  private buildPage() {
    this.startLoading = true;
    let branchesObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(branchesObs));
    res
      .then((results) => {
        let [branches] = results;
        if (
          typeof branches.response !== 'string' &&
          typeof branches.response !== 'number'
        ) {
          this.branches = branches.response;
        }
        this.startLoading = false;
        this.cdf.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdf.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createForm();
    this.createHeadersGroup();
    this.buildPage();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'atype':
      case 'colname':
      case 'ovalue':
      case 'nvalue':
      case 'aby':
      case 'adate':
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
      case 'atype':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.auditTrails,
          element
        );
      case 'adate':
        return new Date(element[key]).toDateString();
      default:
        return element[key] ? element[key] : '-';
    }
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  submitFilter() {
    if (this.formGroup.valid) {
      let value = { ...this.formGroup.value };
      value.Startdate = this.reformatDate(
        this.formGroup.value.Startdate.split('-')
      );
      value.Enddate = this.reformatDate(
        this.formGroup.value.Enddate.split('-')
      );
      value.branch = this.branch.value;
      this.filterAuditTrailsRequest(value);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  downloadSheet() {
    if (this.tableData.auditTrails.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.tableData.auditTrails,
        this.getActiveTableKeys(),
        'audit_trails_report',
        ['adate']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  get tbname() {
    return this.formGroup.get('tbname') as FormControl;
  }
  get Startdate() {
    return this.formGroup.get('Startdate') as FormControl;
  }
  get Enddate() {
    return this.formGroup.get('Enddate') as FormControl;
  }
  get act() {
    return this.formGroup.get('act') as FormControl;
  }
  get branch() {
    return this.formGroup.get('branch') as FormControl;
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
