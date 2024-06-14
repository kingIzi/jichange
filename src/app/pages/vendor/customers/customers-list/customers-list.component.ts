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
  FormControl,
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
import { CustomersDialogComponent } from 'src/app/components/dialogs/Vendors/customers-dialog/customers-dialog.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Customer } from 'src/app/core/models/vendors/customer';
import * as json from 'src/assets/temp/data.json';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoginResponse } from 'src/app/core/models/login-response';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { CustomerService } from 'src/app/core/services/vendor/customers/customer.service';
import { CustomerDetailsTable } from 'src/app/core/enums/vendor/customers/customers-details-table';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    MatDialogModule,
    RouterModule,
    RemoveItemDialogComponent,
    SuccessMessageBoxComponent,
    FormsModule,
    ReactiveFormsModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    LoaderRainbowComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/customer', alias: 'customer' },
    },
  ],
})
export class CustomersListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public customersData: Customer[] = [];
  public customers: Customer[] = [];
  public headersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public CustomerDetailsTable: typeof CustomerDetailsTable =
    CustomerDetailsTable;
  // private headersMap = {
  //   customerName: 0,
  //   emailId: 1,
  //   mobileNo: 2,
  // };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    //private reportService: ReportsService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private requestCustomerNames() {
    this.tableLoading = true;
    this.customerService
      .getCustomersList({
        Comp: this.userProfile.InstID.toString(),
        reg: '0',
        dist: '0',
      })
      .then((results) => {
        if (
          results.response &&
          typeof results.response !== 'string' &&
          typeof results.response !== 'number'
        ) {
          this.customersData = results.response;
          this.customers = this.customersData;
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
  private deleteCustomer(body: { sno: number | string }) {
    this.startLoading = true;
    this.customerService
      .deleteCustomer(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response.toString().toLocaleLowerCase() ===
            body.sno.toString().toLocaleLowerCase()
        ) {
          let msg = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate('customer.removedCustomerSuccessfully')
          );
          this.requestCustomerNames();
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
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case CustomerDetailsTable.NAME:
        this.customers.sort((a, b) =>
          a.Cust_Name.trim().toLocaleLowerCase() >
          b.Cust_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CustomerDetailsTable.EMAIL:
        this.customers.sort((a, b) =>
          a.Email.trim().toLocaleLowerCase() >
          b.Email.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CustomerDetailsTable.MOBILE_NUMBER:
        this.customers.sort((a, b) =>
          a.Phone.trim().toLocaleLowerCase() >
          b.Phone.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case CustomerDetailsTable.NAME:
        this.customers.sort((a, b) =>
          a.Cust_Name.trim().toLocaleLowerCase() <
          b.Cust_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CustomerDetailsTable.EMAIL:
        this.customers.sort((a, b) =>
          a.Email.trim().toLocaleLowerCase() <
          b.Email.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case CustomerDetailsTable.MOBILE_NUMBER:
        this.customers.sort((a, b) =>
          a.Phone.trim().toLocaleLowerCase() <
          b.Phone.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private buildHeadersForm() {
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `customersTable`,
      this.scope,
      this.headers,
      this.fb,
      this
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      this.customers = this.customersData.filter((elem: Customer) => {
        return (
          elem.Cust_Name.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          ) ||
          elem.Email.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          ) ||
          elem.Phone.toLocaleLowerCase().includes(
            searchText.toLocaleLowerCase()
          )
        );
      });
    } else {
      this.customers = this.customersData;
    }
  }
  private openAttachCustomerToInvoiceDialog(customerId: number) {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '600px',
      data: {
        invid: null,
        customerId: customerId,
        userProfile: this.userProfile,
      },
    });
    dialogRef.componentInstance.addedInvoice.asObservable().subscribe(() => {
      this.requestCustomerNames();
      dialogRef.close();
    });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.buildHeadersForm();
    this.requestCustomerNames();
    this.activatedRoute.params.subscribe((params) => {
      if (params['addCustomer']) {
        this.openCustomersDialog();
      }
    });
  }
  sortColumn(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    if (!sortAsc?.value) {
      this.sortTableDesc(ind);
      sortAsc?.setValue(true);
    } else {
      this.sortTableAsc(ind);
      sortAsc?.setValue(false);
    }
  }
  openCustomersDialog() {
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      disableClose: true,
    });
    // dialogRef.componentInstance.attachInvoice
    //   .asObservable()
    //   .subscribe((customerId) => {
    //     dialogRef.close();
    //     this.openAttachCustomerToInvoiceDialog(customerId);
    //     this.requestCustomerNames();
    //   });
    dialogRef.componentInstance.addedCustomer.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestCustomerNames();
    });
  }
  openCustomerEditDialog(customer: Customer) {
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      data: customer,
      disableClose: true,
    });
    // dialogRef.componentInstance.attachInvoice
    //   .asObservable()
    //   .subscribe((customerId) => {
    //     dialogRef.close();
    //     this.openAttachCustomerToInvoiceDialog(customerId);
    //     this.requestCustomerNames();
    //   });
    dialogRef.componentInstance.addedCustomer.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestCustomerNames();
    });
  }
  openRemoveDialog(id: number, removeClient: RemoveItemDialogComponent) {
    removeClient.title = 'Confirm';
    removeClient.message = 'Are you sure you want to delete this customer?';
    removeClient.openDialog();
    removeClient.remove.asObservable().subscribe((event) => {
      this.deleteCustomer({ sno: id });
    });
  }
  encodeCustomerId(customerId: number) {
    return btoa(customerId.toString());
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
