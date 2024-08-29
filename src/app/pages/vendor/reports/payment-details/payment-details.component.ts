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
import { MatSort, MatSortModule } from '@angular/material/sort';
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
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import {
  inOutAnimation,
  listAnimationDesktop,
  listAnimationMobile,
} from 'src/app/components/layouts/main/router-transition-animations';
import { PaymentDetailsTable } from 'src/app/core/enums/vendor/reports/payment-details-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import {
  InvoiceReportForm,
  InvoiceReportFormVendor,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
import {
  InvoiceDetailsForm,
  PaymentDetailReportForm,
} from 'src/app/core/models/vendors/forms/payment-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { PaymentDetail } from 'src/app/core/models/vendors/payment-detail';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { ReportFormInvoiceDetailsComponent } from '../../../../components/dialogs/bank/reports/report-form-invoice-details/report-form-invoice-details.component';
import {
  MatTableExporterModule,
  ExportType,
  MatTableExporterDirective,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    MatPaginatorModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    ReportFormInvoiceDetailsComponent,
    MatTableExporterModule,
  ],
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class PaymentDetailsComponent implements OnInit {
  public tableFormGroup!: FormGroup;
  public filterFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public formData: {
    companies: Company[];
    customers: CustomerName[];
    invoices: InvoiceReport[];
  } = {
    companies: [],
    customers: [],
    invoices: [],
  };
  // public tableData: {
  //   payments: PaymentDetail[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<PaymentDetail>;
  // } = {
  //   payments: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<PaymentDetail>([]),
  // };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
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
    private cdr: ChangeDetectorRef,
    private invoiceService: InvoiceService,
    private reportService: ReportsService,
    private paymentService: PaymentsService,
    private fileHandler: FileHandlerService,
    private invoiceReportService: InvoiceReportServiceService,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<PaymentDetail>,

    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createFilterForm() {
    // this.filterFormGroup = this.fb.group({
    //   compid: this.fb.control(this.getUserProfile().InstID, [
    //     Validators.required,
    //   ]),
    //   cust: this.fb.control('', [Validators.required]),
    //   stdate: this.fb.control('', [Validators.required]),
    //   enddate: this.fb.control('', [Validators.required]),
    //   invno: this.fb.control('', [Validators.required]),
    // });
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
    let TABLE_SHOWING = 10;
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`paymentDetails.paymentsTable`, {}, this.scope)
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
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.cust.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
      );
    }
    if (this.invno.valid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.invoiceNo`)
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
        this.formData.invoices = [];
        this.invno.setValue('all');
      }
    });
  }
  private noInvoiceFoundWarningMessage() {
    let customer = this.formData.customers.find(
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
      this.formData.invoices = result.response;
    } else {
      this.noInvoiceFoundWarningMessage();
      this.formData.invoices = [];
    }
    this.invno.setValue('all');
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
  private buildPage() {
    this.startLoading = true;
    let companiesObservable = from(this.reportService.getCompaniesList({}));
    let customersObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.getUserProfile().InstID,
      })
    );
    let mergedObservable = zip(companiesObservable, customersObservable);
    let res = AppUtilities.pipedObservables(mergedObservable)
      .then((results) => {
        let [companies, customers] = results;
        if (
          companies.response &&
          typeof companies.response !== 'string' &&
          typeof companies.response !== 'number'
        ) {
          this.formData.companies = companies.response;
        }
        if (
          customers.response &&
          typeof customers.response !== 'string' &&
          typeof customers.response !== 'number'
        ) {
          this.formData.customers = customers.response;
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
    let filterPredicate = (data: PaymentDetail, filter: string) => {
      return data.Invoice_Sno.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Control_No &&
          data.Control_No.toLocaleLowerCase().includes(
            filter.toLocaleLowerCase()
          ))
        ? true
        : false ||
          (data.Company_Name &&
            data.Company_Name.toLocaleLowerCase().includes(
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
        case 'Payment_Date':
          return new Date(item['Payment_Date']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<PaymentDetail>(
  //     this.tableData.payments
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private parsePaymentDataList(
    result: HttpDataResponse<number | PaymentDetail[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as PaymentDetail[]);
    }
  }
  private assignPaymentsDataList(
    result: HttpDataResponse<number | PaymentDetail[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.payments = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.paymentDetails.noPaymentsFound`)
    //   );
    //   this.tableData.payments = [];
    // }
    // this.prepareDataSource();
    this.parsePaymentDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private reformatDate(values: string[]) {
    let [year, month, date] = values;
    return `${date}/${month}/${year}`;
  }
  private paymentKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(PaymentDetailsTable.DATE)) {
      keys.push('Payment_Date');
    }
    if (indexes.includes(PaymentDetailsTable.PAYER)) {
      keys.push('Payer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.CUSTOMER)) {
      keys.push('Customer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.INVOICE_NUMBER)) {
      keys.push('Invoice_Sno');
    }
    if (indexes.includes(PaymentDetailsTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(PaymentDetailsTable.CHANNEL)) {
      keys.push('Trans_Channel');
    }
    if (indexes.includes(PaymentDetailsTable.TRANSACTION_NUMBER)) {
      keys.push('Payment_Trans_No');
    }
    if (indexes.includes(PaymentDetailsTable.RECEIPT_NUMBER)) {
      keys.push('Receipt_No');
    }
    if (indexes.includes(PaymentDetailsTable.PAID_AMOUNT)) {
      keys.push('PaidAmount');
    }
    if (indexes.includes(PaymentDetailsTable.BALANCE)) {
      keys.push('Balance');
    }
    if (indexes.includes(PaymentDetailsTable.TOTAL_AMOUNT)) {
      keys.push('Requested_Amount');
    }
    if (indexes.includes(PaymentDetailsTable.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.tableHeaders.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.paymentKeys(indexes);
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
    let titleText = this.tr.translate('reports.paymentDetails.payment');
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
      ['Payment_Date']
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
  private deliveryStatusStyle(status: string) {
    if (status && status.length > 0) {
      return `${PerformanceUtils.getActiveStatusStyles(
        status,
        'Delivered',
        'bg-green-100',
        'text-green-700',
        'bg-orange-100',
        'text-orange-700'
      )} text-center w-fit`;
    } else {
      return 'delivery-status';
    }
  }
  ngOnInit(): void {
    this.createFilterForm();
    this.createHeaderGroup();
    //this.buildPage();
  }
  requestPaymentReport(
    value: PaymentDetailReportForm | InvoiceDetailsForm | InvoiceReportForm
  ) {
    this.tableLoading = true;
    this.paymentService
      .getPaymentReport(value)
      .then((result) => {
        this.assignPaymentsDataList(result);
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
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  isCashAmountColumn(index: number) {
    return (
      index === PaymentDetailsTable.TOTAL_AMOUNT ||
      PaymentDetailsTable.BALANCE ||
      PaymentDetailsTable.PAID_AMOUNT
    );
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Payment_Date':
      case 'Payer_Name':
      case 'Customer_Name':
      case 'Invoice_Sno':
      case 'Control_No':
      case 'Trans_Channel':
      case 'Payment_Trans_No':
      case 'Receipt_No':
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
      case 'Payment_Type':
      case 'Status':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Invoice_Sno':
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
      case 'Status':
        return `${style} ${this.deliveryStatusStyle(element[key])}`;
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
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
      case 'Payment_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      case 'Requested_Amount':
      case 'PaidAmount':
      case 'Balance':
        return (
          PerformanceUtils.moneyFormat(element[key].toString()) +
          ' ' +
          element['Currency_Code']
        );
      case 'Control_No':
        return element['Control_No'] ? element['Control_No'] : '-';
      case 'Status':
        return element[key] ? element[key] : 'Not sent';
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
        fileName: 'payments_report',
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
      this.parsePdf(table as HTMLTableElement, `payments_report`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
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
      this.requestPaymentReport(form);
    } else {
      this.filterFormGroup.markAllAsTouched();
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
