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
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { ReportFormInvoiceDetailsComponent } from 'src/app/components/dialogs/bank/reports/report-form-invoice-details/report-form-invoice-details.component';
import { TableDataService } from 'src/app/core/services/table-data.service';
import {
  TABLE_DATA_SERVICE,
  VENDOR_TABLE_DATA_SERVICE,
} from 'src/app/core/tokens/tokens';
import { AddInvoiceComponent } from '../../../vendor/invoice/created-invoice-list/add-invoice/add-invoice.component';
import { InvoiceDetailsForm } from 'src/app/core/models/vendors/forms/payment-report-form';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { CancelledInvoice } from 'src/app/core/models/vendors/cancelled-invoice';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { CancelledService } from 'src/app/core/services/vendor/reports/cancelled.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from '../../../../components/dialogs/display-message-box/display-message-box.component';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';

@Component({
  selector: 'app-cancelled-invoice-report',
  standalone: true,
  imports: [
    TranslocoModule,
    ReportFormInvoiceDetailsComponent,
    AddInvoiceComponent,
    ReactiveFormsModule,
    CommonModule,
    MatPaginatorModule,
    MatTableModule,
    MatSortModule,
    DisplayMessageBoxComponent,
    MatTableExporterModule,
  ],
  templateUrl: './cancelled-invoice-report.component.html',
  styleUrl: './cancelled-invoice-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
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
})
export class CancelledInvoiceReportComponent implements OnInit {
  public tableLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('cancelledInvoiceTable')
  cancelledInvoiceTable!: ElementRef<HTMLDivElement>;
  @ViewChild('reportFormInvoiceDetails')
  reportFormInvoiceDetails!: ReportFormInvoiceDetailsComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cancelledService: CancelledService,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<CancelledInvoice>,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 8;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        'cancelledInvoices.cancelledInvoiceTableBanker',
        {},
        this.scope
      )
      .subscribe((labels: TableColumnsData[]) => {
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
  }
  private dataSourceFilter() {
    let filterPredicate = (data: CancelledInvoice, filter: string) => {
      return data.Invoice_No.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Control_No &&
          data.Control_No.toLocaleLowerCase().includes(
            filter.toLocaleLowerCase()
          ))
        ? true
        : false ||
          (data.Chus_Name &&
            data.Chus_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false ||
          (data.Customer_Name &&
            data.Customer_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'p_date':
          return new Date(item['p_date']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  private parseCancelledInvoice(
    result: HttpDataResponse<number | CancelledInvoice[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as CancelledInvoice[]);
    }
  }
  private assignCancelledInvoiceResponse(
    result: HttpDataResponse<number | CancelledInvoice[]>
  ) {
    this.parseCancelledInvoice(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private getPdfHeaderLabels() {
    let branch: string =
        this.reportFormInvoiceDetails.filterFormData.branches.find((e) => {
          return e.Sno === Number(this.reportFormInvoiceDetails.branch.value);
        })?.Name || this.tr.translate('defaults.any'),
      vendor: string =
        this.reportFormInvoiceDetails.filterFormData.companies.find((e) => {
          return e.CompSno === Number(this.reportFormInvoiceDetails.Comp.value);
        })?.CompName || this.tr.translate('defaults.all'),
      customer: string =
        this.reportFormInvoiceDetails.filterFormData.customers.find((e) => {
          return (
            e.Cust_Sno === Number(this.reportFormInvoiceDetails.cusid.value)
          );
        })?.Cust_Name || this.tr.translate('defaults.any'),
      invoice: string =
        this.reportFormInvoiceDetails.filterFormData.invoiceReports.find(
          (e) => {
            return (
              e.Inv_Mas_Sno ===
              Number(this.reportFormInvoiceDetails.invno.value)
            );
          }
        )?.Invoice_No || this.tr.translate('defaults.any'),
      from: string = this.reportFormInvoiceDetails.stdate.value
        ? new Date(this.reportFormInvoiceDetails.stdate.value).toDateString()
        : 'N/A',
      to: string = this.reportFormInvoiceDetails.enddate.value
        ? new Date(this.reportFormInvoiceDetails.enddate.value).toDateString()
        : 'N/A';
    return [branch, vendor, customer, invoice, from, to];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    let [branch, vendor, customer, invoice, from, to] =
      this.getPdfHeaderLabels();
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('reports.cancelledInvoices.title');
    let titlePositionY = TableUtilities.writePdfTitleText(doc, titleText);
    let [branchY1, branchY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      this.tr.translate('forms.branch'),
      branch,
      titlePositionY * 2
    );
    let [vendorY1, vendorY2] = TableUtilities.writePdfTextAlignedCenter(
      doc,
      this.tr.translate('forms.vendor'),
      vendor,
      titlePositionY * 2
    );
    let [customerY1, customerY2] = TableUtilities.writePdfTextAlignedRight(
      doc,
      this.tr.translate('forms.customer'),
      customer,
      titlePositionY * 2
    );
    let [invoiceY1, invoiceY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      this.tr.translate('forms.invoiceNumber'),
      invoice,
      branchY2 * 1.25
    );
    let startDateLabel = `${this.tr.translate(
      'forms.from'
    )} (${this.tr.translate('reports.overview.postedDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedCenter(
      doc,
      startDateLabel,
      from,
      branchY2 * 1.25
    );
    let endDateLabel = `${this.tr.translate('forms.to')} (${this.tr.translate(
      'reports.overview.postedDate'
    )})`;
    let [endDateY1, endDateY2] = TableUtilities.writePdfTextAlignedRight(
      doc,
      endDateLabel,
      to,
      branchY2 * 1.25
    );
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.headers,
      ['p_date']
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
  private invoiceStatusStyle(status: string) {
    return 'invoice-expired';
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
  }
  requestCancelledInvoiceReport(form: InvoiceDetailsForm | InvoiceReportForm) {
    this.tableLoading = true;
    this.cancelledService
      .getPaymentReport(form)
      .then((result) => {
        this.assignCancelledInvoiceResponse(result);
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
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'p_date':
      case 'Invoice_No':
      case 'Control_No':
      case 'Customer_Name':
      case 'Chus_Name':
      case 'Invoice_Amount':
      case 'Reason':
      case 'goods_status':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Invoice_Amount':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Invoice_No':
        return `${style} text-black font-semibold`;
      case 'Invoice_Amount':
        return `${style} text-black text-right`;
      case 'Payment_Type':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.Payment_Type,
          `Fixed`,
          `bg-purple-100`,
          `text-purple-700`,
          `bg-teal-100`,
          `text-teal-700`
        )} text-center w-fit`;
      case 'goods_status':
        return `${style} ${this.invoiceStatusStyle(element[key])}`;
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
      case 'p_date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      case 'Invoice_Amount':
        return (
          PerformanceUtils.moneyFormat(element[key].toString()) +
          ' ' +
          element['Currency_Code']
        );
      case 'Control_No':
        return element['Control_No'] ? element['Control_No'] : '-';
      case 'Customer_Name':
        return element['Customer_Name']
          ? element['Customer_Name']
          : element['Chus_Name'];
      case 'goods_status':
        return element[key].toLocaleLowerCase() === 'cancel'.toLocaleLowerCase()
          ? 'Cancelled'
          : element[key];
      default:
        return element[key];
    }
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'cancelled_invoices_Report',
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
        this.cancelledInvoiceTable.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `cancelled_invoices_Report`);
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
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
