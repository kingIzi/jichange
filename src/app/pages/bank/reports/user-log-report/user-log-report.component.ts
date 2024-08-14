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
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { UserLog } from 'src/app/core/models/bank/reports/user-log';
import { UserLogReportTable } from 'src/app/core/enums/bank/reports/user-log-report-table';
import { Observable, TimeoutError, from, of, zip } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
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
  selector: 'app-user-log-report',
  templateUrl: './user-log-report.component.html',
  styleUrls: ['./user-log-report.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderRainbowComponent,
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
})
export class UserLogReportComponent implements OnInit {
  public startLoading: boolean = false;
  // public tableData: {
  //   userReportLogs: UserLog[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<UserLog>;
  // } = {
  //   userReportLogs: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<UserLog>([]),
  // };
  public branches: Branch[] = [];
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('userLogReportContainer')
  userLogReportContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private tr: TranslocoService,
    private branchService: BranchService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<UserLog>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFilterFormGroup() {
    this.tableFilterFormGroup = this.fb.group({
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
      branch: this.fb.control(this.getUserProfile().braid, []),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`userLogReport.userLogReportTable`, {}, this.scope)
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
  private formErrors(
    errorsPath: string = 'reports.userLogReport.form.errors.dialog'
  ) {
    if (this.stdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.startDate`)
      );
    }
    if (this.enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.endDate`)
      );
    }
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.userLogKeys(indexes);
  }
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
  private dataSourceFilter() {
    let filterPredicate = (data: UserLog, filter: string) => {
      return data.Full_Name.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Ipadd &&
          data.Ipadd.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Login_Time':
          return new Date(item['Login_Time']);
        case 'Logout_Time':
          return new Date(item['Logout_Time']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<UserLog>(
  //     this.tableData.userReportLogs
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private parseUserLogDataList(
    result: HttpDataResponse<string | number | UserLog[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as UserLog[]);
    }
  }
  private assignUserLogDataList(
    result: HttpDataResponse<string | number | UserLog[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.userReportLogs = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.userLogReport.noUserLogReportFound`)
    //   );
    //   this.tableData.userReportLogs = [];
    // }
    // this.prepareDataSource();
    this.parseUserLogDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestUserLog(value: any) {
    this.tableLoading = true;
    this.reportsService
      .getUserLogTimes(value)
      .then((result) => {
        this.assignUserLogDataList(result);
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
  private userLogKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(UserLogReportTable.USERNAME)) {
      keys.push('Email');
    }
    if (indexes.includes(UserLogReportTable.IP_ADDRESS)) {
      keys.push('Ipadd');
    }
    if (indexes.includes(UserLogReportTable.USER_GROUP)) {
      keys.push('Full_Name');
    }
    if (indexes.includes(UserLogReportTable.LOGIN_TIME)) {
      keys.push('Login_Time');
    }
    if (indexes.includes(UserLogReportTable.LOGOUT_TIME)) {
      keys.push('Logout_Time');
    }
    return keys;
  }
  private getPdfHeaderLabels() {
    let from: string = this.stdate.value
        ? new Date(this.stdate.value).toDateString()
        : 'N/A',
      to: string = this.enddate.value
        ? new Date(this.enddate.value).toDateString()
        : 'N/A';
    return [from, to];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    let [from, to] = this.getPdfHeaderLabels();
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('reports.userLogReport.userLogReport');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let startDateLabel = `${this.tr.translate(
      'forms.from'
    )} (${this.tr.translate('reports.overview.loginDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      startDateLabel,
      from,
      titlePositionY * 2
    );
    let endDateLabel = `${this.tr.translate('forms.to')} (${this.tr.translate(
      'reports.overview.loginDate'
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
      ['Login_Time', 'Logout_Time']
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
  ngOnInit(): void {
    this.buildPage();
    this.createTableFilterFormGroup();
    this.createTableHeadersFormGroup();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Full_Name':
      case 'Ipadd':
      case 'Description':
      case 'Login_Time':
      case 'Logout_Time':
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
      case 'Full_Name':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    let dateString = (dateObj: Date) => {
      let date = dateObj.toLocaleDateString();
      let time = dateObj.toLocaleTimeString();
      return `${date} at ${time}`;
    };
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableDataService.getData(),
          element
        );
      case 'Login_Time':
      case 'Logout_Time':
        return dateString(new Date(element[key]));
      default:
        return element[key] ? element[key] : '-';
    }
  }
  submitTableFilterForm() {
    if (!this.tableFilterFormGroup.valid) {
      this.tableFilterFormGroup.markAllAsTouched();
    } else {
      let form = { ...this.tableFilterFormGroup.value };
      // value.stdate = AppUtilities.reformatDate(
      //   this.tableFilterFormGroup.value.stdate.split('-')
      // );
      // value.enddate = AppUtilities.reformatDate(
      //   this.tableFilterFormGroup.value.enddate.split('-')
      // );
      if (form.stdate) {
        //form.stdate = new Date(form.stdate).toISOString();
        let startDate = new Date(form.stdate);
        startDate.setHours(0, 0, 0, 0);
        form.stdate = startDate.toISOString();
      }
      if (form.enddate) {
        //form.enddate = new Date(form.enddate).toISOString();
        let endDate = new Date(form.enddate);
        endDate.setHours(23, 59, 59, 999);
        form.enddate = endDate.toISOString();
      }
      form.branch = this.branch.value;
      //this.tableData.userReportLogs = [];
      this.requestUserLog(form);
    }
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  dateToFormat(date: string) {
    return new Date(date);
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'user_log_report',
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
        this.userLogReportContainer.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `user_log_report`);
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
  get stdate() {
    return this.tableFilterFormGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.tableFilterFormGroup.get('enddate') as FormControl;
  }
  get branch() {
    return this.tableFilterFormGroup.get('branch') as FormControl;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
