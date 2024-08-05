import { CommonModule, DatePipe } from '@angular/common';
import {
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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  TranslocoModule,
  TRANSLOCO_SCOPE,
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
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';

@Component({
  selector: 'app-payment-consolidated',
  standalone: true,
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
  ],
  templateUrl: './payment-consolidated.component.html',
  styleUrl: './payment-consolidated.component.scss',
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
export class PaymentConsolidatedComponent implements OnInit {
  // public tableData: {
  //   paymentsReports: InvoiceConsolidatedReport[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<InvoiceConsolidatedReport>;
  // } = {
  //   paymentsReports: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<InvoiceConsolidatedReport>([]),
  // };
  public tableLoading: boolean = false;
  public tableFilterFormGroup!: FormGroup;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('paymentConsolidatedReportContainer')
  paymentConsolidatedReportContainer!: ElementRef<HTMLDivElement>;
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
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
    });
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 6;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`invoicePayments.invoicePaymentsTable`, {}, this.scope)
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
  //       this.tableData.paymentsReports
  //     );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   //this.dataSourceSortingAccessor();
  // }
  private parsePaymentsConsolidatedDataList(
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
  private assignPaymentsConsolidatedDataList(
    result: HttpDataResponse<string | number | InvoiceConsolidatedReport[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.paymentsReports = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.invoiceDetails.noInvoiceFound`)
    //   );
    //   this.tableData.paymentsReports = [];
    // }
    // this.prepareDataSource();
    this.parsePaymentsConsolidatedDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
  }
  private requestPaymentConsolidated(body: {
    stdate: string;
    enddate: string;
  }) {
    this.tableLoading = true;
    this.reportsService
      .getPaymentConsolidatedReport(body)
      .then((result) => {
        this.assignPaymentsConsolidatedDataList(result);
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
    let titleText = this.tr.translate('reports.invoicePayments.label');
    let doc = new jsPDF();
    doc.text(titleText, 13, 15);
    autoTable(doc, {
      html: table,
      margin: { top: 20 },
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
    this.createTableFilterFormGroup();
    this.createTableHeadersFormGroup();
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
        return PerformanceUtils.moneyFormat(element[key].toString());
      default:
        return element[key] ? element[key] : '-';
    }
  }
  submitPaymentConsolidatedReport() {
    if (this.tableFilterFormGroup.valid) {
      let form = { ...this.tableFilterFormGroup.value };
      form.stdate = this.datePipe.transform(form.stdate, 'dd/MM/yyyy');
      form.enddate = this.datePipe.transform(form.enddate, 'dd/MM/yyyy');
      this.requestPaymentConsolidated(form);
    } else {
      this.tableFilterFormGroup.markAllAsTouched();
    }
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length - 1,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'payment_consolidated_details_report',
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
        this.paymentConsolidatedReportContainer.nativeElement.querySelector(
          'table'
        );
      this.parsePdf(table as HTMLTableElement, `transactions_details_report`);
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
