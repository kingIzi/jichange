import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
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
  ],
})
export class CustomerViewComponent implements OnInit {
  public startLoading: boolean = false;
  public customer!: Customer;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public customerInvoices: CustomerInvoice[] = [];
  public customerInvoicesData: CustomerInvoice[] = [];
  public headerFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private customerService: CustomerService,
    private dialog: MatDialog,
    private fileHandler: FileHandlerService,
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
  private buildPage(customerId: string) {}
  private searchTable(searchText: string, paginator: MatPaginator) {}
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
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headerFormGroup.get('tableSearch') as FormArray;
  }
}
