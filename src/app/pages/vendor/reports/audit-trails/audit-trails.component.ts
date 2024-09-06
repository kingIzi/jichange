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
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { AuditTrailsReportFormComponent } from 'src/app/components/dialogs/bank/reports/audit-trails-report-form/audit-trails-report-form.component';
import { AuditTrailsReportForm } from 'src/app/core/models/bank/forms/reports/audit-trails-report-form';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { AuditTrailsService } from 'src/app/core/services/bank/reports/audit-trails/audit-trails.service';
import { LoaderInfiniteSpinnerComponent } from '../../../../reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTableExporterModule } from 'mat-table-exporter';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import {
  AuditTrailLogData,
  ResultsSet,
} from 'src/app/core/models/bank/reports/auditTrail';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { merge, startWith, switchMap, catchError, of, map } from 'rxjs';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { TablePaginationComponent } from 'src/app/components/table-pagination/table-pagination.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';

@Component({
  selector: 'app-audit-trails',
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
  templateUrl: './audit-trails.component.html',
  styleUrl: './audit-trails.component.scss',
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
})
export class AuditTrailsComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public resultsLength: number = 0;
  public headersFormGroup!: FormGroup;
  public AppUtilities: typeof AppUtilities = AppUtilities;
  expandedElement!: AuditTrailLogData | null;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('auditTrailsReportForm')
  auditTrailsReportForm!: AuditTrailsReportFormComponent;
  @ViewChild('sorryImplementationUnderway')
  sorryImplementationUnderway!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private auditTrailsService: AuditTrailsService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<AuditTrailLogData>
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
  private dataSourceFilter() {
    let filterPredicate = (data: AuditTrailLogData, filter: string) => {
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
  private assignAuditTrailsDataList(
    result: HttpDataResponse<number | ResultsSet>
  ) {
    this.parseAuditTrailDataList(result);
    this.tableDataService.initDataSource(this.sort);
    this.dataSourceFilter();
  }
  private filterAuditTrailsRequest(value: AuditTrailsReportForm) {
    this.startLoading = true;
    this.auditTrailsService.getAuditReport(value).subscribe({
      next: (result) => {
        this.assignAuditTrailsDataList(result);
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
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
  ngOnInit(): void {
    this.createHeadersGroup();
  }
  ngAfterViewInit(): void {
    this.sorryImplementationUnderway.nativeElement.showModal();
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
          this.cdr.detectChanges();
        },
        error: (err) => {
          AppUtilities.requestFailedCatchError(
            err,
            this.displayMessageBox,
            this.tr
          );
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        },
      });
  }
  onAuditTrailForm(form: any) {
    form.pageNumber = this.paginator.pageIndex + 1;
    form.pageSize = this.paginator.pageSize;
    this.filterAuditTrailsRequest(form);
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
