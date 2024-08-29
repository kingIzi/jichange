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
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { VendorReportTable } from 'src/app/core/enums/bank/reports/vendor-report-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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
    MatTableExporterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
export class VendorDetailReportComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  // public tableData: {
  //   companies: Company[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<Company>;
  // } = {
  //   companies: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<Company>([]),
  // };
  public filterFormData: {
    branches: Branch[];
  } = {
    branches: [],
  };
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('vendorDetailReportContainer')
  vendorDetailReportContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private fileHandler: FileHandlerService,
    private tr: TranslocoService,
    private branchService: BranchService,
    private reportsService: ReportsService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Company>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFilterForm() {
    this.tableFilterFormGroup = this.fb.group({
      branch: this.fb.control(this.getUserProfile().braid, []),
    });
    if (Number(this.getUserProfile().braid) > 0) {
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
    let filterPredicate = (data: Company, filter: string) => {
      return data.CompName.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      );
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<Company>(
  //     this.tableData.companies
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  // }
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
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.companies = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.vendorReport.noVendorsFound`)
    //   );
    //   this.tableData.companies = [];
    // }
    // this.prepareDataSource();
    this.parseVendorDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.tableLoading = true;
    this.reportsService
      .getAllCompaniesByBranch(body)
      .then((result) => {
        this.assignVendorsDataList(result);
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
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
  private getPdfHeaderLabels() {
    let branch: string =
      this.filterFormData.branches.find((e) => {
        return e.Sno === Number(this.branch.value);
      })?.Name || this.tr.translate('defaults.any');
    return [branch];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    // let titleText = this.tr.translate('reports.vendorReport.vendorReport');
    // let doc = new jsPDF();
    // doc.text(titleText, 13, 15);
    // autoTable(doc, {
    //   html: table,
    //   margin: { top: 20 },
    //   columns: this.headers.controls
    //     .filter(
    //       (h) => h.get('included')?.value && h.get('value')?.value !== 'Action'
    //     )
    //     .map((h) => h.get('label')?.value),
    //   headStyles: {
    //     fillColor: '#8196FE',
    //     textColor: '#000000',
    //   },
    // });
    let [branch] = this.getPdfHeaderLabels();
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('reports.vendorReport.vendorReport');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let [branchY1, branchY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      this.tr.translate('forms.branch'),
      branch,
      titlePositionY * 2
    );
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.headers,
      []
    );
    autoTable(doc, {
      body: body,
      margin: { top: branchY2 * 1.15 },
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
    this.createTableFilterForm();
    this.createTableHeadersFormGroup();
    this.buildPage();
    this.submitTableFilterForm();
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
          'Approved',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
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
          this.tableDataService.getData(),
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
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'vendors_summary_report',
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
        this.vendorDetailReportContainer.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `vendors_summary_report`);
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
