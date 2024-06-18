import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { Customer } from 'src/app/core/models/vendors/customer';
import * as json from 'src/assets/temp/data.json';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginResponse } from 'src/app/core/models/login-response';
import {
  from,
  zip,
  lastValueFrom,
  map,
  catchError,
  Observable,
  of,
} from 'rxjs';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { Company } from 'src/app/core/models/bank/company/company';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { CancelledService } from 'src/app/core/services/vendor/reports/cancelled.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { CancelledInvoice } from 'src/app/core/models/vendors/cancelled-invoice';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { CancelledInvoiceTable } from 'src/app/core/enums/vendor/reports/cancelled-invoice-table';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';

@Component({
  selector: 'app-invoice-cancelled',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    RouterModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
    MatTableModule,
    MatSortModule,
  ],
  templateUrl: './invoice-cancelled.component.html',
  styleUrl: './invoice-cancelled.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class InvoiceCancelledComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public invoicesListData: CancelledInvoice[] = [];
  public invoicesList: CancelledInvoice[] = [];
  private originalTableColumns: TableColumnsData[] = [];
  public tableColumns: TableColumnsData[] = [];
  public tableColumns$!: Observable<TableColumnsData[]>;
  public dataSource!: MatTableDataSource<CancelledInvoice>;
  public filterFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public companies: Company[] = [];
  public customers: { Cus_Mas_Sno: number; Customer_Name: string }[] = [];
  public invoices: GeneratedInvoice[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CancelledInvoiceTable: typeof CancelledInvoiceTable =
    CancelledInvoiceTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private reportService: ReportsService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private cancelledService: CancelledService,
    private invoiceReportService: InvoiceReportServiceService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 7;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    // TableUtilities.createHeaders(
    //   this.tr,
    //   `cancelledInvoiceTable`,
    //   this.scope,
    //   this.headers,
    //   this.fb,
    //   this
    // );
    this.tr
      .selectTranslate(`cancelledInvoiceTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.originalTableColumns = labels;
        this.originalTableColumns.forEach((column, index) => {
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
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableColumns$ = of(this.tableColumns);
  }
  private createFilterForm() {
    this.filterFormGroup = this.fb.group({
      compid: this.fb.control(this.userProfile.InstID, [Validators.required]),
      cust: this.fb.control(0, [Validators.required]),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
      invno: this.fb.control('', []),
    });
    this.compid.disable({ emitEvent: true });
    this.customerChanged();
  }
  private customerChanged() {
    this.cust.valueChanges.subscribe((value) => {
      if (value !== 'all') {
        let form = {
          Comp: this.userProfile.InstID,
          cusid: value,
          stdate: '',
          enddate: '',
        } as InvoiceReportForm;
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
                this.tr.translate(`defaults.failed`),
                this.tr.translate(`reports.invoiceDetails.noInvoicesFound`)
              );
              this.invoices = [];
            } else if (
              typeof result.response !== 'string' &&
              typeof result.response !== 'number' &&
              result.response.length > 0
            ) {
              this.invoices = result.response as any;
            }
            this.startLoading = false;
            this.cdr.detectChanges();
          })
          .catch((err) => {
            this.invoices = [];
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
        this.invoices = [];
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
          this.companies = companies.response;
        }
        if (
          customers.response &&
          typeof customers.response !== 'string' &&
          typeof customers.response !== 'number'
        ) {
          this.customers = customers.response;
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
  private openCustomerInvoiceDialog(customer: Customer) {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      data: {
        customer: customer,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  private formErrors(
    errorsPath = 'invoice.invoiceDetailsForm.form.errors.dialog'
  ) {
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.invoicesList = this.invoicesListData.filter((elem) => {
        return (
          elem.Customer_Name.toLocaleLowerCase().includes(text) ||
          elem.Invoice_No.toLocaleLowerCase().includes(text)
        );
      });
    } else {
      this.invoicesList = this.invoicesListData;
    }
  }
  private dataSourceFilter() {
    this.dataSource.filterPredicate = (
      data: CancelledInvoice,
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
        : false ||
          (data.Customer_Name &&
            data.Customer_Name.toLocaleLowerCase().includes(
              filter.toLocaleLowerCase()
            ))
        ? true
        : false;
    };
  }
  private dataSourceSortingAccessor() {
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'p_date':
          return new Date(item['p_date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.dataSource = new MatTableDataSource<CancelledInvoice>(
      this.invoicesList
    );
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private requestCancelledInvoice(value: any) {
    this.invoicesListData = [];
    this.invoicesList = this.invoicesListData;
    this.tableLoading = true;
    this.cancelledService
      .getPaymentReport(value)
      .then((result) => {
        if (
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.invoicesList = result.response;
          this.prepareDataSource();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.invoicesListData = [];
          this.invoicesList = this.invoicesListData;
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
  ngOnInit(): void {
    this.parseUserProfile();
    this.createTableHeadersFormGroup();
    this.createFilterForm();
    this.buildPage();
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
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(this.invoicesList, element);
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
      default:
        return element[key];
    }
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  submitFilterForm() {
    if (this.filterFormGroup.valid) {
      let value = { ...this.filterFormGroup.value };
      value.compid = this.compid.value;
      value.stdate = AppUtilities.reformatDate(
        this.filterFormGroup.value.stdate.split('-')
      );
      value.enddate = AppUtilities.reformatDate(
        this.filterFormGroup.value.enddate.split('-')
      );
      this.requestCancelledInvoice(value);
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
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
