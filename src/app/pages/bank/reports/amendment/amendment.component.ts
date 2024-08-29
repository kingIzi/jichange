import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NO_ERRORS_SCHEMA,
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
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Observable, firstValueFrom, from, of, zip } from 'rxjs';
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
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import {
  InvoiceReportForm,
  InvoiceReportFormBanker,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { AmendmentsService } from 'src/app/core/services/vendor/reports/amendments.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { ReportFormInvoiceDetailsComponent } from '../../../../components/dialogs/bank/reports/report-form-invoice-details/report-form-invoice-details.component';
import { InvoiceDetailsForm } from 'src/app/core/models/vendors/forms/payment-report-form';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import {
  ExportType,
  MatTableExporterDirective,
  MatTableExporterModule,
} from 'mat-table-exporter';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-amendment',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    ReportFormInvoiceDetailsComponent,
    MatTableExporterModule,
  ],
  templateUrl: './amendment.component.html',
  styleUrl: './amendment.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
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
export class AmendmentComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public filterForm!: FormGroup;
  public tableFormGroup!: FormGroup;
  // public tableData: {
  //   amendments: GeneratedInvoice[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<GeneratedInvoice>;
  // } = {
  //   amendments: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<GeneratedInvoice>([]),
  // };
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
    invoiceReports: InvoiceReport[];
    branches: Branch[];
  } = {
    companies: [],
    customers: [],
    invoiceReports: [],
    branches: [],
  };
  public statuses: string[] = ['Paid', 'Pending', 'Cancelled'];
  public paymentTypes: string[] = ['Fixed', 'Flexible'];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public AmendmentReportTable: typeof AmendmentReportTable =
    AmendmentReportTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('amendmentsTable') amendmentsTable!: ElementRef<HTMLDivElement>;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('reportFormInvoiceDetails')
  reportFormInvoiceDetails!: ReportFormInvoiceDetailsComponent;
  constructor(
    private appConfig: AppConfigService,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private amendmentService: AmendmentsService,
    private branchService: BranchService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<GeneratedInvoice>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createFilterForm() {
    this.filterForm = this.fb.group({
      compid: this.fb.control('', [Validators.required]),
      cust: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.getUserProfile().braid, [
        Validators.required,
      ]),
      invno: this.fb.control('', []),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
    if (Number(this.getUserProfile().braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.companyChangedEventHandler();
    this.filterFormChanged();
  }
  private branchChangedEventHandler() {
    this.branch.valueChanges.subscribe((value) => {
      this.requestCompaniesList({ branch: value });
    });
  }
  private companyChangedEventHandler() {
    this.compid.valueChanges.subscribe((value) => {
      this.requestCustomersList({ Sno: value });
    });
  }
  private filterFormChanged() {
    this.filterForm.valueChanges.subscribe((value) => {
      if (value.compid && value.cust) {
        let form = {
          branch: this.getUserProfile().braid,
          Comp: value.compid,
          cusid: value.cust,
          stdate: '',
          enddate: '',
        } as InvoiceReportFormBanker;
        this.requestInvoicesList(form);
      }
    });
  }
  private assignCompaniesFilterData(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'number' &&
      typeof result.response !== 'string'
    ) {
      this.filterFormData.companies = result.response;
    } else {
      this.filterFormData.companies = [];
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
    this.compid.setValue('all');
  }
  private assignCustomersFilterData(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'number' &&
      typeof result.response !== 'string'
    ) {
      this.filterFormData.customers = result.response;
    } else {
      if (this.compid.value !== 'all') {
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          this.tr.translate(
            `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
          )
        );
      }
      this.filterFormData.customers = [];
    }
    this.cust.setValue('all');
  }
  private noInvoiceFoundWarningMessage() {
    let customer = this.filterFormData.customers.find(
      (elem) => elem.Cust_Sno === Number(this.cust.value)
    );
    if (customer) {
      let message = this.tr
        .translate(`reports.amendmentDetails.noInvoicesFound`)
        .replace('{}', customer.Cust_Name);
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
      this.filterFormData.invoiceReports = result.response;
    } else {
      this.noInvoiceFoundWarningMessage();
      this.filterFormData.invoiceReports = [];
    }
    //this.invno.setValue('all');
  }
  private requestCustomersList(body: { Sno: number | string }) {
    this.startLoading = true;
    this.reportsService
      .getCustomerDetailsList(body)
      .then((result) => {
        this.assignCustomersFilterData(result);
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
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
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
  private requestInvoicesList(body: InvoiceReportFormBanker) {
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
        this.filterFormData.customers = [];
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private async createHeaderGroup() {
    let TABLE_SHOWING = 8;
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`amendmentDetails.amendmentTableBanker`, {}, this.scope)
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
    if (this.compid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.company`)
      );
    }
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
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
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
  private parseAmendmentsDataList(
    result: HttpDataResponse<string | number | GeneratedInvoice[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as GeneratedInvoice[]);
    }
  }
  private assignAmendmentsDataList(
    result: HttpDataResponse<string | number | GeneratedInvoice[]>
  ) {
    // if (
    //   result.response &&
    //   typeof result.response !== 'string' &&
    //   typeof result.response !== 'number' &&
    //   result.response.length > 0
    // ) {
    //   this.tableData.amendments = result.response;
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.warning`),
    //     this.tr.translate(`reports.amendmentDetails.noReportsFound`)
    //   );
    //   this.tableData.amendments = [];
    // }
    // this.prepareDataSource();
    this.parseAmendmentsDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.getUserProfile().braid,
      })
    );
    let branchObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(companiesObs, branchObs));
    res
      .then((results) => {
        let [companies, branchList] = results;
        if (typeof companies.response !== 'number') {
          this.filterFormData.companies = companies.response as Company[];
          this.startLoading = false;
        }
        if (
          typeof branchList.response !== 'number' &&
          typeof branchList.response !== 'string'
        ) {
          this.filterFormData.branches = branchList.response as Branch[];
          this.startLoading = false;
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.filterFormData.companies = [];
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
  private amendmentReportTableKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(AmendmentReportTable.DUE_DATE)) {
      keys.push('Due_Date');
    }
    if (indexes.includes(AmendmentReportTable.INVOICE_NUMBER)) {
      keys.push('Invoice_No');
    }
    if (indexes.includes(AmendmentReportTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(AmendmentReportTable.CUSTOMER_NAME)) {
      keys.push('Chus_Name');
    }
    if (indexes.includes(AmendmentReportTable.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    if (indexes.includes(AmendmentReportTable.REASON)) {
      keys.push('Reason');
    }
    if (indexes.includes(AmendmentReportTable.EXPIRY_DATE)) {
      keys.push('Invoice_Expired_Date');
    }
    return keys;
  }
  private getTableActiveKeys() {
    let indexes = this.tableHeaders.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.amendmentReportTableKeys(indexes);
  }
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
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
  requestAmendmentsReport(value: InvoiceDetailsForm | InvoiceReportForm) {
    this.tableLoading = true;
    this.amendmentService
      .getAmendmentsReport(value)
      .then((result) => {
        this.assignAmendmentsDataList(result);
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
      case 'Due_Date':
      case 'Invoice_No':
      case 'Control_No':
      case 'Chus_Name':
      case 'Payment_Type':
      case 'Reason':
      case 'Invoice_Expired_Date':
      case 'Invoice_Date':
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
      case 'Invoice_Date':
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
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  downloadSheet() {
    // if (this.tableDataService.getData().length > 0) {
    //   this.exporter.hiddenColumns = [
    //     this.tableDataService.getTableColumns().length,
    //   ];
    //   this.exporter.exportTable(ExportType.XLSX, {
    //     fileName: 'amendment_report_table',
    //     Props: {
    //       Author: 'Biz logic solutions',
    //     },
    //   });
    // } else {
    //   AppUtilities.openDisplayMessageBox(
    //     this.displayMessageBox,
    //     this.tr.translate(`defaults.failed`),
    //     this.tr.translate(`errors.noDataFound`)
    //   );
    // }
    if (this.tableDataService.getData().length > 0) {
      this.exporter.hiddenColumns = [
        this.tableDataService.getTableColumns().length,
      ];
      this.exporter.exportTable(ExportType.XLSX, {
        fileName: 'amendment_report_table',
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
      let table = this.amendmentsTable.nativeElement.querySelector('query');
      this.parsePdf(table as HTMLTableElement, `amendment_report_table`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  isCashAmountColumn(index: number) {
    return false;
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
    return this.filterForm.get('compid') as FormControl;
  }
  get cust() {
    return this.filterForm.get('cust') as FormControl;
  }
  get invno() {
    return this.filterForm.get('invno') as FormControl;
  }
  get branch() {
    return this.filterForm.get('branch') as FormControl;
  }
  get stdate() {
    return this.filterForm.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterForm.get('enddate') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
