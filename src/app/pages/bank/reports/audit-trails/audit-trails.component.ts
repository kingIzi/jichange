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
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';

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
    MatTableExporterModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
    {
      provide: TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
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
  // public tableData: {
  //   auditTrails: AuditTrail[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<AuditTrail>;
  // } = {
  //   auditTrails: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<AuditTrail>([]),
  // };
  public headersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('auditTrailTableContainer')
  auditTrailTableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private auditTrailsService: AuditTrailsService,
    private fileHandler: FileHandlerService,
    private branchService: BranchService,
    private cdf: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<AuditTrail>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersGroup() {
    let TABLE_SHOWING = 7;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`auditTrails.auditTrailsTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
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
      this.tableDataService.searchTable(value);
    });
  }
  private resetTableColumns() {
    let tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableDataService.setTableColumns(tableColumns);
    this.tableDataService.setTableColumnsObservable(tableColumns);
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private createForm() {
    this.formGroup = this.fb.group({
      tbname: this.fb.control(this.selectPageOptions[0], [Validators.required]),
      Startdate: this.fb.control('', [Validators.required]),
      Enddate: this.fb.control('', [Validators.required]),
      act: this.fb.control(this.actions[0], [Validators.required]),
      branch: this.fb.control(this.getUserProfile().braid, []),
    });
    if (Number(this.getUserProfile().braid) > 0) {
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
    let filterPredicate = (data: AuditTrail, filter: string) => {
      return data.atype
        .toLocaleLowerCase()
        .includes(filter.toLocaleLowerCase());
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'adate':
          return new Date(item['adate']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<AuditTrail>(
  //     this.tableData.auditTrails
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private parseAuditTrailDataList(
    result: HttpDataResponse<string | number | AuditTrail[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as AuditTrail[]);
    }
  }
  private assignAuditTrailsDataList(
    result: HttpDataResponse<string | number | AuditTrail[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.auditTrails = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.auditTrails.noAuditTrailsFound`)
    //   );
    //   this.tableData.auditTrails = [];
    // }
    // this.prepareDataSource();
    this.parseAuditTrailDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private filterAuditTrailsRequest(value: AuditTrailsReportForm) {
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
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
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
  private parsePdf(table: HTMLTableElement, filename: string) {
    let titleText = this.tr.translate('reports.auditTrails.auditTrails');
    let doc = new jsPDF();
    doc.text(titleText, 13, 15);
    autoTable(doc, {
      html: table,
      margin: { top: 20 },
      // columns: this.tableDataService.getTableColumns().map((t,index) => {
      //   return t.label;
      // }),
      columns: this.headers.controls
        .filter(
          (h) => h.get('included')?.value && h.get('value')?.value !== 'Action'
        )
        .map((h) => h.get('label')?.value),
      headStyles: {
        fillColor: '#8196FE',
        textColor: '#000000',
      },
    });
    doc.save(`${filename}.pdf`);
  }
  ngOnInit(): void {
    this.createForm();
    this.createHeadersGroup();
    this.buildPage();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
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
          this.tableDataService.getData(),
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
      let form = { ...this.formGroup.value };
      // value.Startdate = this.reformatDate(
      //   this.formGroup.value.Startdate.split('-')
      // );
      // value.Enddate = this.reformatDate(
      //   this.formGroup.value.Enddate.split('-')
      // );
      if (form.Startdate) {
        //form.stdate = new Date(form.stdate).toISOString();
        let startDate = new Date(form.Startdate);
        startDate.setHours(0, 0, 0, 0);
        form.Startdate = startDate.toISOString();
      }
      if (form.Enddate) {
        //form.enddate = new Date(form.enddate).toISOString();
        let endDate = new Date(form.Enddate);
        endDate.setHours(23, 59, 59, 999);
        form.Enddate = endDate.toISOString();
      }
      form.branch = this.branch.value;
      this.filterAuditTrailsRequest(form);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  downloadSheet() {
    // if (this.tableData.auditTrails.length > 0) {
    //   this.fileHandler.downloadExcelTable(
    //     this.tableData.auditTrails,
    //     this.getActiveTableKeys(),
    //     'audit_trails_report',
    //     ['adate']
    //   );
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.failed`),
    //     this.tr.translate(`errors.noDataFound`)
    //   );
    // }
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'audit_trails_report',
        Props: {
          Author: 'Biz logic solutions',
        },
      });
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  downloadPdf() {
    if (this.tableDataService.getData().length > 0) {
      let table =
        this.auditTrailTableContainer.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `audit_trails_report`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  getTableDataSource() {
    return this.tableDataService.getDataSource();
  }
  getTableDataList() {
    return this.tableDataService.getData();
  }
  getTableDataColumns() {
    return this.tableDataService.getTableColumns();
  }
  geTableDataColumnsObservable() {
    return this.tableDataService.getTableColumnsObservable();
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
