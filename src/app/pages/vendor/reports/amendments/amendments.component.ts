import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AmendmentReportTable } from 'src/app/core/enums/vendor/reports/amendment-report-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { CustomerName } from 'src/app/core/models/vendors/customer-name';
import { InvoiceReportFormVendor } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { AmendmentsService } from 'src/app/core/services/vendor/reports/amendments.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
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
  ],
  templateUrl: './amendments.component.html',
  styleUrl: './amendments.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmendmentsComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public filterFormGroup!: FormGroup;
  public tableFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public tableData: {
    amendments: GeneratedInvoice[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<GeneratedInvoice>;
  } = {
    amendments: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<GeneratedInvoice>([]),
  };
  public filterFormData: {
    companies: Company[];
    customers: CustomerName[];
    invoices: GeneratedInvoice[];
  } = {
    companies: [],
    customers: [],
    invoices: [],
  };
  public userProfile!: LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private reportService: ReportsService,
    private amendmentService: AmendmentsService,
    private invoiceReportService: InvoiceReportServiceService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createFilterForm() {
    this.filterFormGroup = this.fb.group({
      compid: this.fb.control(this.userProfile.InstID, [Validators.required]),
      cust: this.fb.control('all', [Validators.required]),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
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
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
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
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.tableHeaders.controls
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
  private customerChanged() {
    this.cust.valueChanges.subscribe((value) => {
      if (value !== 'all') {
        let form = {
          Comp: this.userProfile.InstID,
          cusid: value,
          stdate: '',
          enddate: '',
        } as InvoiceReportFormVendor;
        this.startLoading = true;
        this.invoiceReportService
          .getInvoiceReport(form)
          .then((result) => {
            if (
              typeof result.response !== 'string' &&
              typeof result.response !== 'number' &&
              result.response.length == 0
            ) {
              AppUtilities.openDisplayMessageBox(
                this.displayMessageBox,
                this.tr.translate(`defaults.warning`),
                this.tr.translate(`reports.invoiceDetails.noInvoicesFound`)
              );
              this.filterFormData.invoices = [];
            } else if (
              typeof result.response !== 'string' &&
              typeof result.response !== 'number' &&
              result.response.length > 0
            ) {
              this.filterFormData.invoices = result.response as any;
            }
            this.startLoading = false;
            this.cdr.detectChanges();
          })
          .catch((err) => {
            this.filterFormData.invoices = [];
            AppUtilities.requestFailedCatchError(
              err,
              this.displayMessageBox,
              this.tr
            );
            this.startLoading = false;
            this.cdr.detectChanges();
            throw err;
          });
      } else {
        this.filterFormData.invoices = [];
      }
    });
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObservable = from(this.reportService.getCompaniesList({}));
    let customersObservable = from(
      this.invoiceService.getInvoiceCustomerNames({
        compid: this.userProfile.InstID,
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
    this.tableData.dataSource.filterPredicate = (
      data: GeneratedInvoice,
      filter: string
    ) => {
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
  }
  private dataSourceSortingAccessor() {
    this.tableData.dataSource.sortingDataAccessor = (
      item: any,
      property: string
    ) => {
      switch (property) {
        case 'Due_Date':
          return new Date(item['Due_Date']);
        case 'Invoice_Expired_Date':
          return new Date(item['Invoice_Expired_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<GeneratedInvoice>(
      this.tableData.amendments
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestAmendmentsReport(value: any) {
    this.tableLoading = true;
    this.amendmentService
      .getAmendmentsReport(value)
      .then((results) => {
        if (
          typeof results.response === 'string' &&
          typeof results.response === 'number'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.warning`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.amendments = [];
          this.prepareDataSource();
        } else if (
          results.response instanceof Array &&
          results.response.length === 0
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.warning`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.tableData.amendments = [];
          this.prepareDataSource();
        } else {
          this.tableData.amendments = results.response as GeneratedInvoice[];
          this.prepareDataSource();
        }
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createFilterForm();
    this.createHeaderGroup();
    this.buildPage();
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
          this.tableData.amendments,
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
      form.compid = this.userProfile.InstID;
      form.stdate = this.reformatDate(
        this.filterFormGroup.value.stdate.split('-')
      );
      form.enddate = this.reformatDate(
        this.filterFormGroup.value.enddate.split('-')
      );
      this.requestAmendmentsReport(form);
    } else {
      this.filterFormGroup.markAllAsTouched();
    }
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
