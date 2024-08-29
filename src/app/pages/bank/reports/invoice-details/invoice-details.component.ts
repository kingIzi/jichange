import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  viewChild,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { Datepicker, Input, initTE } from 'tw-elements';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company/company';
import { Observable, TimeoutError, firstValueFrom, from, of, zip } from 'rxjs';
import { Customer } from 'src/app/core/models/bank/customer';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import {
  InvoiceReportForm,
  InvoiceReportFormBanker,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceDetailsTable } from 'src/app/core/enums/bank/reports/invoice-details-table';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  inOutAnimation,
  listAnimationDesktop,
  listAnimationMobile,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { ReportFormDetailsComponent } from 'src/app/components/dialogs/bank/reports/report-form-details/report-form-details.component';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import { BankService } from 'src/app/core/services/bank/setup/bank/bank.service';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import { InvoiceDetailsForm } from 'src/app/core/models/vendors/forms/payment-report-form';

@Component({
  selector: 'app-invoice-details',
  templateUrl: './invoice-details.component.html',
  styleUrls: ['./invoice-details.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    ReportFormDetailsComponent,
    MatTableExporterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class InvoiceDetailsComponent implements OnInit {
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
    branches: Branch[];
  } = {
    companies: [],
    customers: [],
    branches: [],
  };
  public formGroup!: FormGroup;
  public headerFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public InvoiceDetailsTable: typeof InvoiceDetailsTable = InvoiceDetailsTable;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('invoiceDetailsTable')
  invoiceDetailsTable!: ElementRef<HTMLDivElement>;
  @ViewChild('reportFormDetails')
  reportFormDetails!: ReportFormDetailsComponent;
  constructor(
    private appConfig: AppConfigService,
    private tr: TranslocoService,
    private dialog: MatDialog,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private fb: FormBuilder,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef,
    private bankUserService: BankService,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<InvoiceReport>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  // private async buildPage() {
  //   this.startLoading = true;
  //   let companiesObs = from(
  //     this.reportsService.getBranchedCompanyList({
  //       branch: this.getUserProfile().braid,
  //     })
  //   );
  //   let branchObs = from(this.branchService.postBranchList({}));
  //   let res = AppUtilities.pipedObservables(zip(companiesObs, branchObs));
  //   res
  //     .then((results) => {
  //       let [companiesList, branchList] = results;
  //       if (
  //         typeof companiesList.response !== 'number' &&
  //         typeof companiesList.response !== 'string'
  //       ) {
  //         this.filterFormData.companies = companiesList.response as Company[];
  //       }
  //       if (
  //         typeof branchList.response !== 'number' &&
  //         typeof branchList.response !== 'string'
  //       ) {
  //         this.filterFormData.branches = branchList.response;
  //       }
  //       this.startLoading = false;
  //       this.cdr.detectChanges();
  //     })
  //     .catch((err) => {
  //       AppUtilities.requestFailedCatchError(
  //         err,
  //         this.displayMessageBox,
  //         this.tr
  //       );
  //       this.filterFormData.companies = [];
  //       this.startLoading = false;
  //       this.cdr.detectChanges();
  //       throw err;
  //     });
  // }
  private createRequestFormGroup() {
    this.formGroup = this.fb.group({
      Comp: this.fb.control(0, [Validators.required]),
      cusid: this.fb.control(0, [Validators.required]),
      branch: this.fb.control(this.getUserProfile().braid, []),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
    if (Number(this.getUserProfile().braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.companyChangedEventHandler();
  }
  private branchChangedEventHandler() {
    this.branch.valueChanges.subscribe((value) => {
      this.requestCompaniesList({ branch: value });
    });
  }
  private assignCompaniesFilterData(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.filterFormData.companies = [];
    } else {
      this.filterFormData.companies = result.response as Company[];
      if (this.filterFormData.companies.length === 0) {
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          this.tr
            .translate(`reports.customerDetailReport.noVendorsFoundInBranch`)
            .replace(
              '{}',
              this.filterFormData.branches.find(
                (b) => b.Branch_Sno.toString() === this.branch.value
              )?.Name as string
            )
        );
      }
    }
    this.Comp.setValue(0);
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.startLoading = true;
    this.reportsService
      .getBranchedCompanyList(body)
      .then((result) => {
        this.assignCompaniesFilterData(result);
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
  private assignCustomersFilterData(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.filterFormData.customers = [];
    } else {
      this.filterFormData.customers = result.response as Customer[];
      if (this.filterFormData.customers.length === 0) {
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          this.tr.translate(
            `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
          )
        );
      }
    }
    this.cusid.setValue(0);
  }
  private companyChangedEventHandler() {
    this.startLoading = true;
    this.Comp.valueChanges.subscribe((value) => {
      this.startLoading = true;
      let companyList = this.reportsService.getCustomerDetailsList({
        Sno: value,
      });
      companyList
        .then((result) => {
          if (
            typeof result.response !== 'number' &&
            typeof result.response !== 'string'
          ) {
            this.filterFormData.customers = result.response;
          } else {
            if (this.Comp.value !== 0) {
              AppUtilities.openDisplayMessageBox(
                this.displayMessageBox,
                this.tr.translate(`defaults.warning`),
                this.tr.translate(
                  `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
                )
              );
            }
            this.filterFormData.customers = [];
            this.cusid.setValue(0);
          }
          //this.assignCustomersFilterData(result);
          this.startLoading = false;
          this.cdr.detectChanges();
        })
        .catch((err) => {
          AppUtilities.requestFailedCatchError(
            err,
            this.displayMessageBox,
            this.tr
          );
          this.filterFormData.customers = [];
          this.cusid.setValue(0);
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        });
    });
  }
  private createHeaderGroup() {
    let TABLE_SHOWING = 10;
    this.headerFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(
        `invoiceDetails.invoiceDetailsTableBanker`,
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
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private getTableActiveKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.invoiceReportKeys(indexes);
  }
  private dataSourceFilter() {
    let filterPredicate = (data: InvoiceReport, filter: string) => {
      return data.Invoice_No.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      ) ||
        (data.Control_No &&
          data.Control_No.toLocaleLowerCase().includes(
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
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
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
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.Comp.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.company`)
      );
    }
    if (this.cusid.invalid) {
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
  private invoiceReportKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(InvoiceDetailsTable.POSTED_DATE)) {
      keys.push('p_date');
    }
    if (indexes.includes(InvoiceDetailsTable.INVOICE_NUMBER)) {
      keys.push('Invoice_No');
    }
    if (indexes.includes(InvoiceDetailsTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(InvoiceDetailsTable.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    if (indexes.includes(InvoiceDetailsTable.TOTAL)) {
      keys.push('Total');
    }
    if (indexes.includes(InvoiceDetailsTable.STATUS)) {
      keys.push('goods_status');
    }
    if (indexes.includes(InvoiceDetailsTable.COMPANY_NAME)) {
      keys.push('Company_Name');
    }
    if (indexes.includes(InvoiceDetailsTable.CUSTOMER_NAME)) {
      keys.push('Chus_Name');
    }
    if (indexes.includes(InvoiceDetailsTable.INVOICE_DATE)) {
      keys.push('Invoice_Date');
    }
    if (indexes.includes(InvoiceDetailsTable.DUE_DATE)) {
      keys.push('Due_Date');
    }
    if (indexes.includes(InvoiceDetailsTable.EXPIRY_DATE)) {
      keys.push('Invoice_Expired_Date');
    }
    return keys;
  }
  private parseVendorDataList(
    result: HttpDataResponse<string | number | InvoiceReport[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as InvoiceReport[]);
    }
  }
  private assignInvoiceReportDataList(
    result: HttpDataResponse<string | number | InvoiceReport[]>
  ) {
    this.parseVendorDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private getPdfHeaderLabels() {
    let branch: string =
        this.reportFormDetails.filterFormData.branches.find((e) => {
          return e.Sno === Number(this.reportFormDetails.branch.value);
        })?.Name || this.tr.translate('defaults.any'),
      vendor: string =
        this.reportFormDetails.filterFormData.companies.find((e) => {
          return e.CompSno === Number(this.reportFormDetails.Comp.value);
        })?.CompName || this.tr.translate('defaults.all'),
      customer: string =
        this.reportFormDetails.filterFormData.customers.find((e) => {
          return e.Cust_Sno === Number(this.reportFormDetails.cusid.value);
        })?.Cust_Name || this.tr.translate('defaults.any'),
      from: string = this.reportFormDetails.stdate.value
        ? new Date(this.reportFormDetails.stdate.value).toDateString()
        : 'N/A',
      to: string = this.reportFormDetails.enddate.value
        ? new Date(this.reportFormDetails.enddate.value).toDateString()
        : 'N/A';
    return [branch, vendor, customer, from, to];
  }
  private parsePdf(table: HTMLTableElement, filename: string) {
    // let titleText = this.tr.translate('reports.invoiceDetails.invoiceDetails');
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
    // doc.save(`${filename}.pdf`);
    let [branch, vendor, customer, from, to] = this.getPdfHeaderLabels();
    let doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let titleText = this.tr.translate('reports.invoiceDetails.invoiceDetails');
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
    let startDateLabel = `${this.tr.translate(
      'forms.from'
    )} (${this.tr.translate('reports.invoiceDetails.invoiceDate')})`;
    let [startDateY1, startDateY2] = TableUtilities.writePdfTextAlignedLeft(
      doc,
      startDateLabel,
      from,
      branchY2 * 1.25
    );
    let endDateLabel = `${this.tr.translate('forms.to')} (${this.tr.translate(
      'reports.invoiceDetails.invoiceDate'
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
      ['Invoice_Date', 'Due_Date', 'Invoice_Expired_Date']
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
  private deliveryStatusStyle(deliveryStatus?: string) {
    if (deliveryStatus) {
      return `${PerformanceUtils.getActiveStatusStyles(
        deliveryStatus,
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
  private invoiceStatusStyle(status: string) {
    if (status && status.toLocaleLowerCase() === 'active') {
      return 'invoice-active';
    } else if (status.toLocaleLowerCase() === 'overdue') {
      return 'invoice-overdue';
    } else if (status.toLocaleLowerCase() === 'expired') {
      return 'invoice-expired';
    } else return 'invoice-completed';
  }
  ngOnInit(): void {
    initTE({ Datepicker, Input });
    this.createRequestFormGroup();
    this.createHeaderGroup();
    //this.buildPage();
  }
  requestInvoiceDetails(body: InvoiceReportForm | InvoiceDetailsForm) {
    this.tableLoading = true;
    this.invoiceReportService
      .getInvoiceReport(body)
      .then((result) => {
        this.assignInvoiceReportDataList(result);
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
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'p_date':
      case 'Invoice_No':
      case 'Control_No':
      case 'Payment_Type':
      case 'Total':
      case 'goods_status':
      case 'Company_Name':
      case 'Chus_Name':
      case 'Invoice_Date':
      case 'Due_Date':
      case 'Invoice_Expired_Date':
      case 'Status':
      case 'delivery_status':
      case 'p_date':
      case 'AuditBy':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Total':
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
        return `${PerformanceUtils.getActiveStatusStyles(
          element.goods_status,
          'Approved',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} w-fit`;
      case 'Status':
        return `${style} ${this.invoiceStatusStyle(element[key])}`;
      case 'delivery_status':
        return `${style} ${this.deliveryStatusStyle(element[key])}`;
      case 'Total':
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
      case 'p_date':
      case 'Invoice_Date':
      case 'Due_Date':
      case 'Invoice_Expired_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      case 'Total':
        return (
          PerformanceUtils.moneyFormat(element[key].toString()) +
          ' ' +
          element['Currency_Code']
        );
      case 'Control_No':
      case 'AuditBy':
        return element[key] ?? '-';
      case 'delivery_status':
        return element[key] ? element[key] : 'Not sent';
      default:
        return element[key];
    }
  }
  downloadSheet() {
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'invoice_details_table',
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
      let table = this.invoiceDetailsTable.nativeElement.querySelector('table');
      this.parsePdf(table as HTMLTableElement, `invoice_details_table`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  moneyFormat(amount: number) {
    return AppUtilities.moneyFormat(amount.toString());
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  isCashAmountColumn(index: number) {
    return index === InvoiceDetailsTable.TOTAL;
  }
  openInvoiceDetailsGraph() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: {},
        headers: [],
        generatedInvoices: [],
      },
    });
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
  get Comp() {
    return this.formGroup.get('Comp') as FormControl;
  }
  get cusid() {
    return this.formGroup.get('cusid') as FormControl;
  }
  get branch() {
    return this.formGroup.get('branch') as FormControl;
  }
  get stdate() {
    return this.formGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.formGroup.get('enddate') as FormControl;
  }
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headerFormGroup.get(`tableSearch`) as FormControl;
  }
}
