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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.scss'],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/customer', alias: 'customer' },
    },
    {
      provide: VENDOR_TABLE_DATA_SERVICE,
      useClass: TableDataService,
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
    MatTooltipModule,
  ],
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class CustomerViewComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public customer!: Customer;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headerFormGroup!: FormGroup;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private customerService: CustomerService,
    private invoiceReportService: InvoiceReportServiceService,
    private dialog: MatDialog,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<InvoiceReport>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private buildFormHeaders() {
    let TABLE_SHOWING = 6;
    this.headerFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`customerView.customerInvoicesTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
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
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: InvoiceReport, filter: string) => {
      return data.Invoice_No.toLocaleLowerCase().includes(
        filter.toLocaleLowerCase()
      );
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  private parseInvoiceReportDataList(
    result: HttpDataResponse<number | InvoiceReport[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as InvoiceReport[]);
    }
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
    result: HttpDataResponse<number | InvoiceReport[]>
  ) {
    this.parseInvoiceReportDataList(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilterPredicate();
    this.dataSourceSortingAccessor();
  }
  private buildPage(customerId: string) {
    this.startLoading = true;
    let customerObs = from(
      this.customerService.getCustomerById({
        compid: this.getUserProfile().InstID,
        Sno: customerId,
      })
    );
    let invoiceReportObs = from(
      this.invoiceReportService.getInvoiceReport({
        branch: this.getUserProfile().braid,
        companyIds: [Number(this.getUserProfile().InstID)],
        customerIds: [Number(customerId)],
        stdate: '',
        enddate: '',
        // Comp: this.getUserProfile().InstID,
        // cusid: customerId,
        // stdate: '',
        // enddate: '',
      } as InvoiceReportForm)
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
  ngOnInit(): void {
    this.buildFormHeaders();
    this.activatedRoute.params.subscribe((params) => {
      if (params['id']) {
        let customerId = atob(params['id']);
        this.buildPage(customerId);
      }
    });
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableDataService.getData(),
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
  openInvoiceDetailsDialog() {
    // let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
    //   width: '800px',
    //   disableClose: true,
    //   data: {
    //     invid: null,
    //     userProfile: this.getUserProfile(),
    //     customerId: null,
    //   },
    // });
    // dialogRef.componentInstance.addedInvoice.asObservable().subscribe(() => {
    //   dialogRef.close();
    //   //this.requestCreatedInvoiceList();
    // });
    // if (this.customer) {
    //   let custid = btoa(this.customer.Cust_Sno.toString());
    //   this.router.navigate([`/vendor/customers/${custid}`], {
    //     queryParams: { customerId: btoa(this.customer.Cust_Sno.toString()) },
    //   });
    // }
    let custid = btoa(this.customer.Cust_Sno.toString());
    this.router.navigate([`/vendor/customers/${custid}/add/add`], {
      queryParams: { customerId: btoa(this.customer.Cust_Sno.toString()) },
    });
  }
  getAddInvoiceUrl() {
    let baseUrl = '/vendor/customers';
    if (this.customer) {
      let sno = this.customer.Cust_Sno.toString();
      return `${baseUrl}/${btoa(sno)}/transaction/add`;
    } else {
      return '';
    }
  }
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headerFormGroup.get('tableSearch') as FormArray;
  }
}
