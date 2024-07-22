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
import { Router, RouterModule } from '@angular/router';
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
import { LoginResponse } from 'src/app/core/models/login-response';
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
  ],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class SummaryComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public headersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
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
    private dialog: MatDialog,
    private router: Router,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createHeadersFormGroup() {
    let TABLE_SHOWING = 7;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`summary.companySummary`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
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
  private companyKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(CompanySummaryTable.NAME)) {
      keys.push('CompName');
    }
    if (indexes.includes(CompanySummaryTable.ADDRESS)) {
      keys.push('Address');
    }
    if (indexes.includes(CompanySummaryTable.EMAIL)) {
      keys.push('Email');
    }
    if (indexes.includes(CompanySummaryTable.TIN_NUMBER)) {
      keys.push('TinNo');
    }
    if (indexes.includes(CompanySummaryTable.MOBILE_NUMBER)) {
      keys.push('MobNo');
    }
    if (indexes.includes(CompanySummaryTable.STATUS)) {
      keys.push('Status');
    }
    if (indexes.includes(CompanySummaryTable.DIRECTOR_NAME)) {
      keys.push('DirectorName');
    }
    if (indexes.includes(CompanySummaryTable.POST_BOX)) {
      keys.push('PostBox');
    }
    if (indexes.includes(CompanySummaryTable.TELEPHONE_NUMBER)) {
      keys.push('TelNo');
    }
    if (indexes.includes(CompanySummaryTable.DATE_POSTED)) {
      keys.push('Posteddate');
    }
    return keys;
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Company,
      filter: string
    ) => {
      return data.CompName.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.TinNo &&
          data.TinNo.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))
        ? true
        : false;
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
  private assignVendorsDataList(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.tableData.companies = result.response;
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr.translate(`company.summary.noVendorsFoundInBranch`)
      );
      this.tableData.companies = [];
    }
    this.prepareDataSource();
  }
  private requestList() {
    this.tableData.companies = [];
    this.prepareDataSource();
    this.tableLoading = true;
    this.reportsService
      .getBranchedCompanyList({ branch: this.userProfile.braid })
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
  private parsePdf(table: HTMLTableElement, filename: string) {
    let doc = new jsPDF();
    doc.text('Vendors Summary Table', 13, 15);
    autoTable(doc, {
      html: table as HTMLTableElement,
      margin: {
        top: 20,
      },
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
  ngOnInit() {
    this.parseUserProfile();
    this.createHeadersFormGroup();
    this.requestList();
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
          this.tableData.companies,
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
    if (this.tableData.companies.length > 0) {
      this.exporter.hiddenColumns = [this.tableData.tableColumns.length - 1];
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
    if (this.tableData.companies.length > 0) {
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
  get headers(): FormArray {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
}
