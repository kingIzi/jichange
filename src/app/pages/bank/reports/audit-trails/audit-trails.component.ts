import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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
import {
  AuditTrail,
  AuditTrailLogData,
  ResultsSet,
} from 'src/app/core/models/bank/reports/auditTrail';
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
import {
  Observable,
  TimeoutError,
  catchError,
  from,
  map,
  merge,
  of,
  startWith,
  switchMap,
  zip,
} from 'rxjs';
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
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuditTrailsReportFormComponent } from '../../../../components/dialogs/bank/reports/audit-trails-report-form/audit-trails-report-form.component';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    AuditTrailsReportFormComponent,
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
  animations: [
    listAnimationMobile,
    listAnimationDesktop,
    inOutAnimation,
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditTrailsComponent implements OnInit, AfterViewInit {
  //public formGroup!: FormGroup;
  public startLoading: boolean = false;
  //public tableLoading: boolean = false;
  public branches: Branch[] = [];
  public headersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public AppUtilities: typeof AppUtilities = AppUtilities;
  public resultsLength: number = 0;
  expandedElement!: AuditTrailLogData | null;
  @ViewChild('auditTrailsReportForm')
  auditTrailsReportForm!: AuditTrailsReportFormComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('auditTrailTableContainer')
  auditTrailTableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private auditTrailsService: AuditTrailsService,
    private cdf: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<AuditTrailLogData>,
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
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
            let col = this.fb.group({
              included: this.fb.control(index < TABLE_SHOWING, []),
              label: this.fb.control(column.label ?? '', []),
              value: this.fb.control(column.value ?? '', []),
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
  private reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${date}/${month}/${year}`;
  }
  private dataSourceFilter() {
    let filterPredicate = (data: AuditTrailLogData, filter: string) => {
      // return data.Audit_Type &&
      //   data.Audit_Type.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
      //   ? true
      //   : false;
      let index = this.getTableDataList().indexOf(data);
      return this.getTableDataList().at(index)?.Audit_Type &&
        this.getTableDataList()
          .at(index)
          ?.Audit_Type.toLocaleLowerCase()
          .includes(filter.toLocaleLowerCase())
        ? true
        : false;
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
  private parseAuditTrailDataList(
    result: HttpDataResponse<string | number | ResultsSet>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.resultsLength = (result.response as ResultsSet).size;
      this.tableDataService.setData((result.response as ResultsSet).content);
    }
  }
  private assignAuditTrailsDataList(
    result: HttpDataResponse<number | ResultsSet>
  ) {
    this.parseAuditTrailDataList(result);
    this.tableDataService.initDataSource(this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private filterAuditTrailsRequest(value: AuditTrailsReportForm) {
    this.startLoading = true;
    this.auditTrailsService.getAuditReport(value).subscribe({
      next: (result) => {
        this.assignAuditTrailsDataList(result);
        this.startLoading = false;
        this.cdf.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdf.detectChanges();
        throw err;
      },
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
  private getPdfHeaderLabels() {
    let from: string = this.auditTrailsReportForm.Startdate.value
        ? new Date(this.auditTrailsReportForm.Startdate.value).toDateString()
        : 'N/A',
      to: string = this.auditTrailsReportForm.Enddate.value
        ? new Date(this.auditTrailsReportForm.Enddate.value).toDateString()
        : 'N/A';
    return [from, to];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    let [from, to] = this.getPdfHeaderLabels();
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('reports.auditTrails.auditTrails');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let startDateLabel = `${this.tr.translate(
      'forms.from'
    )} (${this.tr.translate('reports.overview.postedDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      startDateLabel,
      from,
      titlePositionY * 2
    );
    let endDateLabel = `${this.tr.translate('forms.to')} (${this.tr.translate(
      'reports.overview.postedDate'
    )})`;
    let [endDateY1, endDateY2] = TableUtilities.writePdfTextAlignedRight(
      doc,
      endDateLabel,
      to,
      titlePositionY * 2
    );
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.headers,
      ['adate']
    );
    autoTable(doc, {
      body: body,
      margin: { top: endDateY2 * 1.15 },
      columns: this.tableDataService.getTableColumns().map((c) => {
        return c.label;
      }),
      headStyles: {
        fillColor: '#0B6587',
        textColor: '#ffffff',
      },
    });
    doc.save(`${filename}.pdf`);
  }
  private getTableNameLabel(element: AuditTrailLogData) {
    let prefix = 'reports.auditTrails.display';
    let tableName = AppUtilities.replaceUnderscoreValue(element.Table_Name);
    let columnName = AppUtilities.replaceUnderscoreValue(element.ColumnsName);
    switch (element.Audit_Type?.toLocaleLowerCase()) {
      case 'insert'.toLocaleLowerCase():
        return this.tr
          .translate(`${prefix}.insert`)
          .replace('{table}', `'${tableName}'`)
          .replace('{column}', `'${columnName}'`);
      case 'update'.toLocaleLowerCase():
        return this.tr
          .translate(`${prefix}.update`)
          .replace('{table}', `'${tableName}'`)
          .replace('{column}', `'${columnName}'`);
      case 'delete'.toLocaleLowerCase():
        return this.tr
          .translate(`${prefix}.delete`)
          .replace('{table}', `'${tableName}'`);
      default:
        return `Untracked Audit type caught. Audit Sno is ${element.Audit_Sno}`;
    }
  }
  ngAfterViewInit(): void {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.startLoading = true;
          let form = this.auditTrailsReportForm.getFormData();
          form.pageNumber = this.paginator.pageIndex + 1;
          form.pageSize = this.paginator.pageSize;
          return this.auditTrailsService
            .getAuditReport(form)
            .pipe(catchError(() => of(null)));
        }),
        map((data) => {
          this.startLoading = false;
          if (data === null) {
            return [];
          }
          if (AppUtilities.hasErrorResult(data!)) {
            return [];
          }
          return data;
        })
      )
      .subscribe({
        next: (result: any) => {
          this.assignAuditTrailsDataList(result);
          this.cdf.detectChanges();
        },
        error: (err) => {
          AppUtilities.requestFailedCatchError(
            err,
            this.displayMessageBox,
            this.tr
          );
          this.startLoading = false;
          this.cdf.detectChanges();
          throw err;
        },
      });
  }
  ngOnInit(): void {
    //this.createForm();
    this.createHeadersGroup();
    //this.buildPage();
  }
  tableAuditDate(element: AuditTrailLogData) {
    let postedDate = new Date(element.Audit_Date);
    const time = postedDate.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const formattedDate = postedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    return `${time}, ${formattedDate}`;
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
      case 'Audit_Type':
        return `${style} text-black font-semibold uppercase`;
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
      case 'Table_Name':
        return this.getTableNameLabel(element);
      default:
        return element[key] ? element[key] : '-';
    }
  }
  getColumnsToDisplayWithExpand() {
    //columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    // return [
    //   ...this.tableDataService.getTableColumns(),
    //   { labe: 'expand', value: '' },
    // ];
    return [
      ...this.tableDataService.getTableColumns().map((e) => e.label),
      'expand',
    ];
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  onAuditTrailForm(form: any) {
    form.pageNumber = this.paginator.pageIndex + 1;
    form.pageSize = this.paginator.pageSize;
    this.filterAuditTrailsRequest(form);
  }
  downloadSheet() {
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
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
