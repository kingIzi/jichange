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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Observable, of } from 'rxjs';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

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
    MatTableModule,
    MatSortModule,
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
  public headersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public tableData: {
    customers: Customer[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<Customer>;
  } = {
    customers: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<Customer>([]),
  };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
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
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: Customer,
      filter: string
    ) => {
      return (
        data.Cust_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        ) || data.Email.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
      );
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<Customer>(
      this.tableData.customers
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
  }
  private assignCustomersDataList(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.tableData.customers = result.response;
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr.translate(`customer.noCustomersFound`)
      );
      this.tableData.customers = [];
    }
    this.prepareDataSource();
  }
  private requestCustomerNames() {
    this.tableLoading = true;
    this.customerService
      .getCustomersList({
        Comp: this.userProfile.InstID.toString(),
        reg: '0',
        dist: '0',
      })
      .then((result) => {
        this.assignCustomersDataList(result);
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
  private buildHeadersForm() {
    let TABLE_SHOWING = 5;
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`customersTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(
              index < TABLE_SHOWING || index === labels.length - 1,
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
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
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
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Cust_Name':
      case 'Email':
      case 'Phone':
        return column.value;
      default:
        return '';
    }
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.customers,
          element
        );
      default:
        return element[key];
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Action':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Cust_Name':
        return `${style} text-black font-semibold`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  openCustomersDialog() {
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      disableClose: true,
    });
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
