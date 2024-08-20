import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Company } from 'src/app/core/models/bank/company/company';
import { Ripple, initTE } from 'tw-elements';
import * as json from 'src/assets/temp/data.json';
import { CompanySummaryDialogComponent } from 'src/app/components/dialogs/bank/company/company-summary-dialog/company-summary-dialog.component';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { BreadcrumbService } from 'xng-breadcrumb';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { Observable, TimeoutError, lastValueFrom, of } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { CompanySummaryTable } from 'src/app/core/enums/bank/company/company-summary-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { MatListModule } from '@angular/material/list';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import {
  listAnimationDesktop,
  listAnimationMobile,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TranslocoModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    LoaderRainbowComponent,
    ReactiveFormsModule,
    SuccessMessageBoxComponent,
    DisplayMessageBoxComponent,
    MatTableModule,
    MatSortModule,
    MatListModule,
    MatTableExporterModule,
    MatTooltipModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
    {
      provide: TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class SummaryComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public headersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('summaryTableContainer', { static: false })
  summaryTableContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private activatedRoute: ActivatedRoute,
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private router: Router,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Company>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeadersFormGroup() {
    let TABLE_SHOWING = 7;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`summary.companySummary`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
            let col = this.fb.group({
              included: this.fb.control(
                index === 0
                  ? false
                  : index < TABLE_SHOWING || index === labels.length - 1,
                []
              ),
              label: this.fb.control(column.label, []),
              value: this.fb.control(column.value, []),
            });
            col.get(`included`)?.valueChanges.subscribe((included) => {
              this.resetTableColumns();
            });
            if (index === labels.length - 1) {
              col.disable();
            }
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
  private hasCompIdQueryParamHandler() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params && params['compid']) {
        let compid = atob(params['compid']);
        let found = this.tableDataService
          .getData()
          .find((e) => e.CompSno === Number(compid));
        if (found) {
          this.tableSearch.setValue(found.CompName);
        }
      }
    });
  }
  private dataSourceFilter() {
    let filterPredicate = (data: Company, filter: string) => {
      return data.CompName.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.TinNo &&
          data.TinNo.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseVendorDataList(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Company[]);
    }
  }
  private assignVendorsDataList(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    this.parseVendorDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
  }
  private requestList() {
    this.tableLoading = true;
    this.reportsService
      .getBranchedCompanyList({ branch: this.getUserProfile().braid })
      .then((result) => {
        this.assignVendorsDataList(result);
        this.hasCompIdQueryParamHandler();
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
  private parsePdf(table: HTMLTableElement, filename: string) {
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('company.summary.name');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.headers,
      []
    );
    autoTable(doc, {
      body: body,
      margin: { top: titlePositionY * 2 },
      columns: this.tableDataService
        .getTableColumns()
        .filter((e, i) => {
          return i < this.tableDataService.getTableColumns().length - 1;
        })
        .map((c, i) => {
          return c.label;
        }),
      headStyles: {
        fillColor: '#0B6587',
        textColor: '#ffffff',
      },
    });
    doc.save(`${filename}.pdf`);
  }
  ngOnInit() {
    this.createHeadersFormGroup();
    this.requestList();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'CompName':
      case 'Email':
      case 'TinNo':
      case 'MobNo':
      case 'Status':
      case 'AccountNo':
      case 'Address':
      case 'DirectorName':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'AccountNo':
        return `${style} justify-end`;
      case 'Action':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'CompName':
        return `${style} text-black font-semibold`;
      case 'AccountNo':
        return `${style} text-black text-right`;
      case 'Status':
        return `${PerformanceUtils.getActiveStatusStyles(
          element[key],
          'Approved',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} text-center w-fit`;
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
      case 'AccountNo':
        return element.AccountNo
          ? element.AccountNo.slice(-4).padStart(element.AccountNo.length, 'x')
          : '-';
      default:
        return element[key];
    }
  }
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  openCompanySummaryDialog() {
    let dialogRef = this.dialog.open(CompanySummaryDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        companyData: null,
      },
      disableClose: true,
    });
    dialogRef.componentInstance.companyAddedSuccessfully
      .asObservable()
      .subscribe(() => {
        dialogRef.close();
        this.requestList();
      });
  }
  openEditCompanySummaryDialog(company: Company) {
    // let dialogRef = this.dialog.open(CompanySummaryDialogComponent, {
    //   width: '800px',
    //   height: '600px',
    //   disableClose: true,
    //   data: {
    //     companyData: company,
    //   },
    // });
    // dialogRef.componentInstance.companyAddedSuccessfully
    //   .asObservable()
    //   .subscribe(() => {
    //     dialogRef.close();
    //     this.requestList();
    //   });
    // dialogRef.componentInstance.openDialogFailed
    //   .asObservable()
    //   .subscribe((err) => {
    //     dialogRef.close();
    //   });
    this.router.navigate(['/main/company/summary/add'], {
      queryParams: { Comp: btoa(company.CompSno.toString()) },
    });
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length - 1,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'vendors_summary',
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
        this.summaryTableContainer.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `vendors_summary`);
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
  get headers(): FormArray {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
}
