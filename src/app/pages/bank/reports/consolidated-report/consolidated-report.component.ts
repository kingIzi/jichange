import { CommonModule, DatePipe } from '@angular/common';
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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Observable, of } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { InvoiceConsolidatedReport } from 'src/app/core/models/bank/reports/invoice-consolidated-report';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-consolidated-report',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
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
  templateUrl: './consolidated-report.component.html',
  styleUrl: './consolidated-report.component.scss',
  providers: [
    DatePipe,
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
export class ConsolidatedReportComponent implements OnInit {
  public tableLoading: boolean = false;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  // public tableData: {
  //   invoiceReports: InvoiceConsolidatedReport[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<InvoiceConsolidatedReport>;
  // } = {
  //   invoiceReports: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<InvoiceConsolidatedReport>([]),
  // };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('consolidatedInvoiceTableContainer')
  consolidatedInvoiceTableContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private datePipe: DatePipe,
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<InvoiceConsolidatedReport>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableFilterFormGroup() {
    this.tableFilterFormGroup = this.fb.group({
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 7;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        `invoiceConsolidated.invoiceConsolidatedTable`,
        {},
        this.scope
      )
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
            let col = this.fb.group({
              included: this.fb.control(index < TABLE_SHOWING, []),
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
  // private searchTable(searchText: string) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
  private dataSourceFilter() {
    let filterPredicate = (data: InvoiceConsolidatedReport, filter: string) => {
      return data.vendor &&
        data.vendor.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
        ? true
        : false ||
          (data.branch &&
            data.branch
              .toLocaleLowerCase()
              .includes(filter.toLocaleLowerCase()))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource =
  //     new MatTableDataSource<InvoiceConsolidatedReport>(
  //       this.tableData.invoiceReports
  //     );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   //this.dataSourceSortingAccessor();
  // }
  private parseInvoiceConsolidatedDataList(
    result: HttpDataResponse<string | number | InvoiceConsolidatedReport[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(
        result.response as InvoiceConsolidatedReport[]
      );
    }
  }
  private assignInvoiceConsolidatedDataList(
    result: HttpDataResponse<string | number | InvoiceConsolidatedReport[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.invoiceReports = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.invoiceDetails.noInvoiceFound`)
    //   );
    //   this.tableData.invoiceReports = [];
    // }
    // this.prepareDataSource();
    this.parseInvoiceConsolidatedDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
  }
  private requestInvoiceConsolidated(body: {
    stdate: string;
    enddate: string;
  }) {
    this.tableLoading = true;
    this.reportsService
      .getInvoiceConsolidatedReports(body)
      .then((result) => {
        this.assignInvoiceConsolidatedDataList(result);
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
    let titleText = this.tr.translate('reports.invoiceConsolidated.label');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let startDateLabel = `${this.tr.translate(
      'forms.from'
    )} (${this.tr.translate('reports.invoiceDetails.invoiceDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      startDateLabel,
      from,
      titlePositionY * 2
    );
    let endDateLabel = `${this.tr.translate('forms.to')} (${this.tr.translate(
      'reports.invoiceDetails.invoiceDate'
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
      []
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
    this.createTableFilterFormGroup();
    this.createTableHeadersFormGroup();
    this.submitInvoiceConsolidatedReport();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'branch':
      case 'vendor':
      case 'no_of_invoices':
      case 'invoice_amount':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'invoice_amount':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'vendor':
        return `${style} text-black font-semibold`;
      case 'invoice_amount':
        return `${style} text-right`;
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
      case 'invoice_amount':
        return (
          PerformanceUtils.moneyFormat(element[key].toString()) +
          ' ' +
          element['Currency_Code']
        );
      default:
        return element[key] ? element[key] : '-';
    }
  }
  submitInvoiceConsolidatedReport() {
    if (this.tableFilterFormGroup.valid) {
      let form = { ...this.tableFilterFormGroup.value };
      //form.stdate = this.datePipe.transform(form.stdate, 'dd/MM/yyyy');
      //form.enddate = this.datePipe.transform(form.enddate, 'dd/MM/yyyy');
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
      this.requestInvoiceConsolidated(form);
    } else {
      this.tableFilterFormGroup.markAllAsTouched();
    }
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'consolidated_details_report',
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
        this.consolidatedInvoiceTableContainer.nativeElement.querySelector(
          'table'
        );
      this.parsePdf(table as HTMLTableElement, `consolidated_details_report`);
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
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
