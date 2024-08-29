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
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import {
  Observable,
  catchError,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  of,
  zip,
} from 'rxjs';
import { ReportFormInvoiceDetailsComponent } from 'src/app/components/dialogs/bank/reports/report-form-invoice-details/report-form-invoice-details.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AmendmentReportTable } from 'src/app/core/enums/vendor/reports/amendment-report-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import { InvoiceReportFormVendor } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { AmendmentsService } from 'src/app/core/services/vendor/reports/amendments.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import {
  MatTableExporterModule,
  ExportType,
  MatTableExporterDirective,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-amendments',
  standalone: true,
  imports: [
    MatPaginatorModule,
    CommonModule,
    TranslocoModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    ReportFormInvoiceDetailsComponent,
    MatTableExporterModule,
  ],
  templateUrl: './amendments.component.html',
  styleUrl: './amendments.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
    {
      provide: VENDOR_TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class AmendmentsComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public filterFormGroup!: FormGroup;
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public filterFormData: {
    companies: Company[];
    customers: CustomerName[];
    invoices: InvoiceReport[];
  } = {
    companies: [],
    customers: [],
    invoices: [],
  };
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('tableContainer', { static: false })
  tableContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('reportFormInvoiceDetails')
  reportFormInvoiceDetails!: ReportFormInvoiceDetailsComponent;
  constructor(
    private appConfig: AppConfigService,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private reportService: ReportsService,
    private amendmentService: AmendmentsService,
    private invoiceReportService: InvoiceReportServiceService,
    private cdr: ChangeDetectorRef,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<GeneratedInvoice>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createFilterForm() {
    this.filterFormGroup = this.fb.group({
      compid: this.fb.control(this.getUserProfile().InstID, [
        Validators.required,
      ]),
      cust: this.fb.control(0, [Validators.required]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
      invno: this.fb.control('', []),
    });
    this.compid.disable();
    this.customerChanged();
  }
  private async createHeaderGroup() {
    let TABLE_SHOWING = 7;
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`amendmentDetails.amendmentTable`, {}, this.scope)
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
            this.tableHeaders.push(col);
          });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.tableDataService.searchTable(value);
    });
  }
  private resetTableColumns() {
    let tableColumns = this.tableHeaders.controls
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
  private noInvoiceFoundWarningMessage() {
    let customer = this.filterFormData.customers.find(
      (elem) => elem.Cus_Mas_Sno === Number(this.cust.value)
    );
    if (customer) {
      let message = this.tr
        .translate(`reports.invoiceDetails.noInvoicesFound`)
        .replace('{}', customer.Customer_Name);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        message
      );
    }
  }
  private assignInvoiceListFilterData(
    result: HttpDataResponse<string | number | InvoiceReport[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.filterFormData.invoices = result.response;
    } else {
      this.noInvoiceFoundWarningMessage();
      this.filterFormData.invoices = [];
    }
    this.invno.setValue('');
  }
  private requestInvoicesList(body: InvoiceReportFormVendor) {
    this.startLoading = true;
    this.invoiceReportService
      .getInvoiceReport(body)
      .then((result) => {
        this.assignInvoiceListFilterData(result);
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
  private customerChanged() {
    this.cust.valueChanges.subscribe((value) => {
      if (value !== 'all') {
        let form = {
          Comp: this.getUserProfile().InstID,
          cusid: value,
          stdate: '',
          enddate: '',
        } as InvoiceReportFormVendor;
        this.requestInvoicesList(form);
      } else {
        this.filterFormData.invoices = [];
        this.invno.setValue('');
      }
    });
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObservable = from(this.reportService.getCompaniesList({}));
    let customersObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.getUserProfile().InstID,
      })
    );
    let mergedObservable = zip(companiesObservable, customersObservable);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [companies, customers] = results;
        if (
          companies.response &&
          typeof companies.response !== 'string' &&
          typeof companies.response !== 'number'
        ) {
          this.filterFormData.companies = companies.response;
        }
        if (
          customers.response &&
          typeof customers.response !== 'string' &&
          typeof customers.response !== 'number'
        ) {
          this.filterFormData.customers = customers.response;
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
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.cust.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
      );
    }
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
  private reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${date}/${month}/${year}`;
  }
  private dataSourceFilter() {
    let filterPredicate = (data: GeneratedInvoice, filter: string) => {
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
        : false;
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Due_Date':
          return new Date(item['Due_Date']);
        case 'Invoice_Expired_Date':
          return new Date(item['Invoice_Expired_Date']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<GeneratedInvoice>(
  //     this.tableData.amendments
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private parseAmendmentsReport(
    result: HttpDataResponse<number | GeneratedInvoice[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as GeneratedInvoice[]);
    }
  }
  private assignAmendmentReport(
    result: HttpDataResponse<number | GeneratedInvoice[]>
  ) {
    this.parseAmendmentsReport(result);
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
    let titleText = this.tr.translate('reports.amendmentDetails.amendment');
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
    )} (${this.tr.translate('reports.overview.paymentDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedCenter(
      doc,
      startDateLabel,
      from,
      branchY2 * 1.25
    );
    let endDateLabel = `${this.tr.translate('forms.to')} (${this.tr.translate(
      'reports.overview.paymentDate'
    )})`;
    let [endDateY1, endDateY2] = TableUtilities.writePdfTextAlignedRight(
      doc,
      endDateLabel,
      to,
      branchY2 * 1.25
    );
    let body = TableUtilities.pdfData(
      this.tableDataService.getData(),
      this.tableHeaders,
      ['Invoice_Date', 'Invoice_Expired_Date']
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
    this.createFilterForm();
    this.createHeaderGroup();
    this.buildPage();
  }
  requestAmendmentsReport(value: any) {
    this.tableLoading = true;
    this.amendmentService
      .getAmendmentsReport(value)
      .then((results) => {
        this.assignAmendmentReport(results);
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
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Due_Date':
      case 'Invoice_No':
      case 'Control_No':
      case 'Chus_Name':
      case 'Payment_Type':
      case 'Reason':
      case 'Invoice_Expired_Date':
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
      case 'Invoice_No':
        return `${style} text-black font-semibold`;
      case 'Payment_Type':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.Payment_Type,
          `Fixed`,
          `bg-purple-100`,
          `text-purple-700`,
          `bg-teal-100`,
          `text-teal-700`
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
      case 'Due_Date':
      case 'Invoice_Expired_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      case 'Control_No':
      case 'Reason':
        return element[key] ? element[key] : '-';
      default:
        return element[key];
    }
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
      let form = { ...this.filterFormGroup.value };
      form.compid = this.getUserProfile().InstID;
      form.stdate = !form.stdate
        ? form.stdate
        : new Date(form.stdate).toISOString();
      form.enddate = !form.enddate
        ? form.enddate
        : new Date(form.enddate).toISOString();
      this.requestAmendmentsReport(form);
    } else {
      this.filterFormGroup.markAllAsTouched();
    }
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'amendment_details',
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
      let table = this.tableContainer.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `amendment_details`);
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
  get compid() {
    return this.filterFormGroup.get('compid') as FormControl;
  }
  get cust() {
    return this.filterFormGroup.get('cust') as FormControl;
  }
  get stdate() {
    return this.filterFormGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterFormGroup.get('enddate') as FormControl;
  }
  get invno() {
    return this.filterFormGroup.get('invno') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
