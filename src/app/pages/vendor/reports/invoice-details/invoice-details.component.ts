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
  Form,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Observable, from, of, zip } from 'rxjs';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { InvoiceDetailsReportTable } from 'src/app/core/enums/vendor/reports/invoice-details-report-table';
import { Customer } from 'src/app/core/models/bank/customer';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import {
  InvoiceReportForm,
  InvoiceReportFormVendor,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { InvoiceDetailsTable } from 'src/app/core/enums/bank/reports/invoice-details-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import {
  MatTableExporterModule,
  ExportType,
  MatTableExporterDirective,
} from 'mat-table-exporter';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { ReportFormDetailsComponent } from 'src/app/components/dialogs/bank/reports/report-form-details/report-form-details.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    TableDateFiltersComponent,
    MatDialogModule,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
    ReportFormDetailsComponent,
    MatTableExporterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice-details.component.html',
  styleUrl: './invoice-details.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
    {
      provide: VENDOR_TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class InvoiceDetailsComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  //public userProfile!: LoginResponse;
  public tableFormGroup!: FormGroup;
  public filterFormGroup!: FormGroup;
  private queryData: string = '';
  // public tableData: {
  //   invoiceReports: InvoiceReport[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<InvoiceReport>;
  // } = {
  //   invoiceReports: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<InvoiceReport>([]),
  // };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
  } = {
    companies: [],
    customers: [],
  };
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('exporter') exporter!: MatTableExporterDirective;
  @ViewChild('tableContainer', { static: false })
  tableContainer!: ElementRef<HTMLDivElement>;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private reportService: ReportsService,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    private invoiceReportService: InvoiceReportServiceService,
    private activatedRoute: ActivatedRoute,
    private appConfig: AppConfigService,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<InvoiceReport>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createHeaderGroup() {
    let TABLE_SHOWING = 9;
    this.tableFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`invoiceDetails.invoiceDetailsTable`, {}, this.scope)
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
  private getActiveKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.invoiceReportKeys(indexes);
  }
  // private searchTable(searchText: string, paginator: MatPaginator) {
  //   this.tableData.dataSource.filter = searchText.trim().toLowerCase();
  //   if (this.tableData.dataSource.paginator) {
  //     this.tableData.dataSource.paginator.firstPage();
  //   }
  // }
  private createFilterFormGroup() {
    this.filterFormGroup = this.fb.group({
      Comp: this.fb.control(this.getUserProfile().InstID, []),
      cusid: this.fb.control(0, [Validators.required]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    this.Comp.disable();
  }
  private buildPage() {
    this.startLoading = true;
    let getInvoiceReport = from(
      this.reportService.getCustomerDetailsList({
        Sno: this.getUserProfile().InstID,
      })
    );
    let companiesObs = from(this.reportService.getCompaniesList({}));
    let res = AppUtilities.pipedObservables(
      zip(getInvoiceReport, companiesObs)
    );
    res
      .then((results) => {
        let [customers, companiesList] = results;
        if (
          customers.response &&
          typeof customers.response !== 'number' &&
          typeof customers.response !== 'string'
        ) {
          this.filterFormData.customers = customers.response;
        }
        if (
          typeof companiesList.response !== 'number' &&
          typeof companiesList.response !== 'string'
        ) {
          this.filterFormData.companies = companiesList.response as Company[];
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
  private parseInvoiceDetails(
    result: HttpDataResponse<number | InvoiceReport[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as InvoiceReport[]);
    }
  }
  private assignInvoiceDetailsResponse(
    result: HttpDataResponse<number | InvoiceReport[]>
  ) {
    this.parseInvoiceDetails(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
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
        : false ||
          (data.Company_Name &&
            data.Company_Name.toLocaleLowerCase().includes(
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
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<InvoiceReport>(
  //     this.tableData.invoiceReports
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private determineDueExpiredInvoices(q: string) {
    if (q.toLocaleLowerCase() === 'Due'.toLocaleLowerCase()) {
      // this.tableData.invoiceReports = this.tableData.invoiceReports.filter(
      //   (r) => {
      //     return new Date(r.Due_Date) < new Date();
      //   }
      // );
      let invoices = this.tableDataService.getData();
      invoices = invoices.filter((r) => {
        return new Date(r.Due_Date) < new Date();
      });
      this.tableDataService.setData(invoices);
      this.tableDataService.getDataSource()._updateChangeSubscription();
      this.headers.controls
        .at(InvoiceDetailsReportTable.DUE_DATE)
        ?.get('included')
        ?.setValue(true);
    } else if (q.toLocaleLowerCase() === 'Expired'.toLocaleLowerCase()) {
      let invoices = this.tableDataService.getData();
      invoices = invoices.filter((r) => {
        return new Date(r.Invoice_Expired_Date) < new Date();
      });
      this.tableDataService.setData(invoices);
      this.tableDataService.getDataSource()._updateChangeSubscription();
      this.headers.controls
        .at(InvoiceDetailsReportTable.EXPIRY_DATE)
        ?.get('included')
        ?.setValue(true);
    }
  }
  private initialFormSubmission(q: string) {
    let form = { ...this.filterFormGroup.value };
    this.cusid.setValue(0);
    form.Comp = this.getUserProfile().InstID;
    if (form.stdate) {
      form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
    }
    if (form.enddate) {
      form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
    }
    //this.tableData.invoiceReports = [];
    this.tableLoading = true;
    this.invoiceReportService
      .getInvoiceReport(form)
      .then((result) => {
        // if (
        //   typeof result.response !== 'string' &&
        //   typeof result.response !== 'number' &&
        //   result.response.length == 0
        // ) {
        //   AppUtilities.openDisplayMessageBox(
        //     this.displayMessageBox,
        //     this.tr.translate(`defaults.warning`),
        //     this.tr.translate(`errors.noDataFound`)
        //   );
        //   this.tableData.invoiceReports = [];
        //   this.prepareDataSource();
        // } else if (
        //   typeof result.response !== 'string' &&
        //   typeof result.response !== 'number' &&
        //   result.response.length > 0
        // ) {
        //   this.tableData.invoiceReports = result.response;
        //   this.determineDueExpiredInvoices(q);
        //   this.prepareDataSource();
        // }
        this.assignInvoiceDetailsResponse(result);
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
    let titleText = this.tr.translate('reports.invoiceDetails.invoiceDetails');
    let doc = new jsPDF();
    doc.text(titleText, 13, 15);
    autoTable(doc, {
      html: table,
      margin: { top: 20 },
      // columns: this.tableDataService.getTableColumns().map((t,index) => {
      //   return t.label;
      // }),
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
    //this.parseUserProfile();
    this.createHeaderGroup();
    this.createFilterFormGroup();
    this.buildPage();
    this.activatedRoute.queryParams.subscribe((params: any) => {
      if (params && params['q']) {
        this.queryData = atob(params['q']);
        this.initialFormSubmission(this.queryData);
      }
    });
  }
  requestInvoiceDetails(body: InvoiceReportForm) {
    this.tableLoading = true;
    this.invoiceReportService
      .getInvoiceReport(body)
      .then((result) => {
        this.assignInvoiceDetailsResponse(result);
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
      case 'Total':
        return `${style} text-right`;
      case 'Due_Date':
      case 'Invoice_Expired_Date':
        return this.queryData
          ? `text-black font-semibold`
          : `${style} text-black font-normal`;
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
        return element['Control_No'] ? element['Control_No'] : '-';
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
        fileName: 'invoice_details_report',
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
      this.parsePdf(table as HTMLTableElement, `transactions_details_report`);
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  isCashAmountColumn(index: number) {
    return index === InvoiceDetailsTable.TOTAL;
  }
  // submitFilterForm() {
  //   if (this.filterFormGroup.valid) {
  //     let form = { ...this.filterFormGroup.value } as InvoiceReportFormVendor;
  //     form.Comp = this.getUserProfile().InstID;
  //     if (form.stdate) {
  //       form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
  //     }
  //     if (form.enddate) {
  //       form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
  //     }
  //     this.requestInvoiceDetails(form);
  //   } else {
  //     this.filterFormGroup.markAllAsTouched();
  //   }
  // }
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
    return this.tableFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get(`tableSearch`) as FormControl;
  }
  get Comp() {
    return this.filterFormGroup.get(`Comp`) as FormControl;
  }
  get cusid() {
    return this.filterFormGroup.get(`cusid`) as FormControl;
  }
  get stdate() {
    return this.filterFormGroup.get(`stdate`) as FormControl;
  }
  get enddate() {
    return this.filterFormGroup.get(`enddate`) as FormControl;
  }
}
