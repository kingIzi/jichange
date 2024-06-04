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
//import * as json from 'src/assets/temp/data.json';
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
import { from, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { CustomerViewTable } from 'src/app/core/enums/vendor/customers/customer-view-table';

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
  ],
})
export class CustomerViewComponent implements OnInit {
  public startLoading: boolean = false;
  public customer!: Customer;
  public invoiceReports: InvoiceReport[] = [];
  public invoiceReportsData: InvoiceReport[] = [];
  public CustomerViewTable: typeof CustomerViewTable = CustomerViewTable;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headerFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
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
    this.headerFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `customerView.customerInvoicesTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      6,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
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
        if (
          typeof customer.response !== 'string' &&
          typeof customer.response !== 'number'
        ) {
          this.customer = customer.response;
        }
        if (
          typeof invoices.response !== 'string' &&
          typeof invoices.response !== 'number'
        ) {
          this.invoiceReportsData = invoices.response;
          this.invoiceReports = this.invoiceReportsData;
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
  private sortTableAsc(ind: number) {
    switch (ind) {
      case CustomerViewTable.DATE:
        this.invoiceReports.sort((a, b) =>
          new Date(a.Invoice_Date) > new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case CustomerViewTable.INVOICE_NUMBER:
        this.invoiceReports.sort((a, b) =>
          a.Invoice_No > b.Invoice_No ? 1 : -1
        );
        break;
      case CustomerViewTable.CONTROL_NUMBER:
        this.invoiceReports.sort((a, b) =>
          a.Control_No > b.Control_No ? 1 : -1
        );
        break;
      case CustomerViewTable.AMOUNT:
        this.invoiceReports.sort((a, b) => (a.Total > b.Total ? 1 : -1));
        break;
      case CustomerViewTable.STATUS:
        this.invoiceReports.sort((a, b) =>
          a.goods_status > b.goods_status ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case CustomerViewTable.DATE:
        this.invoiceReports.sort((a, b) =>
          new Date(a.Invoice_Date) < new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case CustomerViewTable.INVOICE_NUMBER:
        this.invoiceReports.sort((a, b) =>
          a.Invoice_No < b.Invoice_No ? 1 : -1
        );
        break;
      case CustomerViewTable.CONTROL_NUMBER:
        this.invoiceReports.sort((a, b) =>
          a.Control_No < b.Control_No ? 1 : -1
        );
        break;
      case CustomerViewTable.AMOUNT:
        this.invoiceReports.sort((a, b) => (a.Total < b.Total ? 1 : -1));
        break;
      case CustomerViewTable.STATUS:
        this.invoiceReports.sort((a, b) =>
          a.goods_status < b.goods_status ? 1 : -1
        );
        break;
      default:
        break;
    }
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
    if (indexes.includes(CustomerViewTable.AMOUNT)) {
      keys.push('Total');
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
    if (searchText) {
      paginator.firstPage();
      let text = searchText.trim().toLowerCase();
      let keys = this.getActiveTableKeys();
      this.invoiceReports = this.invoiceReportsData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
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
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headerFormGroup.get('tableSearch') as FormArray;
  }
}
