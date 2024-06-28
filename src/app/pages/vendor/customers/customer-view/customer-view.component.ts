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
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { CustomerReceiptDialogComponent } from 'src/app/components/dialogs/Vendors/customer-receipt-dialog/customer-receipt-dialog.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { CustomerInvoice } from 'src/app/core/models/vendors/customer-invoice';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CustomerService } from 'src/app/core/services/vendor/customers/customer.service';
import { Customer } from 'src/app/core/models/vendors/customer';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { Observable, from, of, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { CustomerViewTable } from 'src/app/core/enums/vendor/customers/customer-view-table';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.scss'],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/customer', alias: 'customer' },
    },
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    RouterModule,
    RemoveItemDialogComponent,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    MatTableModule,
    MatSortModule,
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class CustomerViewComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public customer!: Customer;
  public tableData: {
    invoiceReports: InvoiceReport[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<InvoiceReport>;
  } = {
    invoiceReports: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<InvoiceReport>([]),
  };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headerFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private customerService: CustomerService,
    private invoiceReportService: InvoiceReportServiceService,
    private dialog: MatDialog,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private buildFormHeaders() {
    let TABLE_SHOWING = 6;
    this.headerFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`customerView.customerInvoicesTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(
              index === 0
                ? false
                : index < TABLE_SHOWING || index === labels.length - 1,
              []
            ),
            label: this.fb.control(column.label, []),
            value: this.fb.control(column.value, []),
          });
          col.get(`included`)?.valueChanges.subscribe((included) => {
            this.resetTableColumns();
          });
          if (index === labels.length - 1) {
            col.disable();
          }
          this.headers.push(col);
        });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.headers.controls
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: InvoiceReport,
      filter: string
    ) => {
      return data.Invoice_No.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      );
    };
  }
  private dataSourceSortingAccessor() {
    this.tableData.dataSource.sortingDataAccessor = (
      item: any,
      property: string
    ) => {
      switch (property) {
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<InvoiceReport>(
      this.tableData.invoiceReports
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private assignViewingCustomer(
    result: HttpDataResponse<string | number | Customer>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number'
    ) {
      this.customer = result.response;
    } else {
      this.customer = new Customer();
    }
  }
  private assignInvoiceReportDataList(
    result: HttpDataResponse<string | number | InvoiceReport[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.tableData.invoiceReports = result.response;
    } else {
      this.tableData.invoiceReports = [];
    }
    this.prepareDataSource();
  }
  private buildPage(customerId: string) {
    this.startLoading = true;
    let customerObs = from(
      this.customerService.getCustomerById({
        compid: this.userProfile.InstID,
        Sno: customerId,
      })
    );
    let invoiceReportObs = from(
      this.invoiceReportService.getInvoiceReport({
        branch: '',
        Comp: this.userProfile.InstID,
        cusid: customerId,
        stdate: '',
        enddate: '',
      })
    );
    let merged = zip(customerObs, invoiceReportObs);
    let res = AppUtilities.pipedObservables(merged);
    res
      .then((results) => {
        let [customer, invoices] = results;
        this.assignViewingCustomer(customer);
        this.assignInvoiceReportDataList(invoices);
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
  private customerViewTable(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(CustomerViewTable.DATE)) {
      keys.push('Invoice_Date');
    }
    if (indexes.includes(CustomerViewTable.INVOICE_NUMBER)) {
      keys.push('Invoice_No');
    }
    if (indexes.includes(CustomerViewTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(CustomerViewTable.STATUS)) {
      keys.push('goods_status');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.customerViewTable(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.buildFormHeaders();
    this.activatedRoute.params.subscribe((params) => {
      if (params['id']) {
        let customerId = atob(params['id']);
        this.buildPage(customerId);
      }
    });
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.invoiceReports,
          element
        );
      case 'Invoice_Date':
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
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Total':
        return `${style} text-right`;
      case 'goods_status':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.goods_status,
          'Approved',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} w-fit`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  convertDate(date: string) {
    return AppUtilities.convertDotNetJsonDateToDate(date);
  }
  moneyFormat(amount: number) {
    return AppUtilities.moneyFormat(amount.toString());
  }
  openCustomerReceipt(receipt: any) {
    let dialogRef = this.dialog.open(CustomerReceiptDialogComponent, {
      width: '800px',
      data: {
        receipts: [receipt],
      },
    });
    dialogRef.afterOpened().subscribe(() => {
      let element = dialogRef.componentInstance.receiptView
        .nativeElement as HTMLDivElement;

      this.fileHandler.downloadPdf(element, `invoice.pdf`);
      dialogRef.close();
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  downloadAllRecipts(receipts: any[]) {
    let dialogRef = this.dialog.open(CustomerReceiptDialogComponent, {
      width: '800px',
      data: {
        receipts: receipts,
      },
    });
    dialogRef.afterOpened().subscribe(() => {
      let element = dialogRef.componentInstance.receiptView
        .nativeElement as HTMLDivElement;

      this.fileHandler.downloadPdf(element, `invoices.pdf`);
      dialogRef.close();
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  isCashAmountColumn(index: number) {
    return index === CustomerViewTable.AMOUNT;
  }
  invoiceNumberToBase64(invoice_number: string) {
    return btoa(invoice_number);
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Invoice_Date':
      case 'Invoice_No':
      case 'Control_No':
      case 'Total':
      case 'goods_status':
        return column.value;
      default:
        return '';
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Total':
      case 'Action':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headerFormGroup.get('tableSearch') as FormArray;
  }
}
