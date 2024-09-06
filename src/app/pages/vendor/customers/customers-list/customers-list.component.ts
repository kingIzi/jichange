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
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { DeleteBankUserForm as DeleteCustomerForm } from 'src/app/core/models/bank/forms/setup/bank-user/delete-bank-user-form';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CustomerDetailsForm } from 'src/app/core/models/bank/reports/customer-details-form';

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
    MatTooltipModule,
  ],
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
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class CustomersListComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public headersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
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
    private appConfigService: AppConfigService,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<Customer>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: Customer, filter: string) => {
      return (
        data.Cust_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        ) || data.Email.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
      );
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private parseRequestCustomerNamesResponse(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as Customer[]);
    }
  }
  private requestCustomerNames() {
    let compid = this.getUserProfile().InstID;
    this.tableLoading = true;
    this.customerService
      .getCustomersList({ vendors: [compid] } as CustomerDetailsForm)
      .then((result) => {
        this.parseRequestCustomerNamesResponse(result);
        this.tableDataService.prepareDataSource(this.paginator, this.sort);
        this.dataSourceFilterPredicate();
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
  private switchDeleteCustomerErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Not found.'.toLocaleLowerCase():
        return this.tr.translate(`errors.notFound`);
      case 'Failed to delete customer: active invoice prevents deletion.'.toLocaleLowerCase():
        return this.tr.translate(
          'customer.form.dialog.addFailedCustomerMappedToInvoice'
        );
      default:
        return this.tr.translate(`customer.failedToRemoveCustomer`);
    }
  }
  private parseDeleteCustomerResponse(result: HttpDataResponse<number>) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchDeleteCustomerErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let msg = this.tr.translate('customer.removedCustomerSuccessfully');
      AppUtilities.showSuccessMessage(
        msg,
        () => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.Cust_Sno === result.response);
      this.tableDataService.removedData(index);
    }
  }
  private deleteCustomer(body: DeleteCustomerForm) {
    this.startLoading = true;
    this.customerService
      .deleteCustomer(body)
      .then((result) => {
        this.parseDeleteCustomerResponse(result);
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
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
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
  ngOnInit(): void {
    this.buildHeadersForm();
    this.requestCustomerNames();
    this.activatedRoute.params.subscribe((params) => {
      if (params['addCustomer']) {
        this.openCustomersDialog();
      }
    });
  }
  getUserProfile() {
    return this.appConfigService.getLoginResponse() as VendorLoginResponse;
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
          this.tableDataService.getData(),
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
      data: {
        customer: null,
        allowAttachInvoice: true,
      },
    });
    dialogRef.componentInstance.addedCustomer
      .asObservable()
      .subscribe((customer) => {
        dialogRef.close();
        this.tableDataService.addedData(customer);
      });
  }
  openCustomerEditDialog(customer: Customer) {
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      data: {
        customer: customer,
      },
      disableClose: true,
    });
    dialogRef.componentInstance.addedCustomer
      .asObservable()
      .subscribe((customer) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.Cust_Sno === customer.Cust_Sno);
        this.tableDataService.editedData(customer, index);
      });
  }
  openRemoveDialog(id: number, removeClient: RemoveItemDialogComponent) {
    removeClient.title = 'Confirm';
    removeClient.message = 'Are you sure you want to delete this customer?';
    removeClient.openDialog();
    removeClient.remove.asObservable().subscribe((event) => {
      let deleteCustomerForm = {
        sno: id,
        userid: this.appConfigService.getUserIdFromSessionStorage(),
      };
      this.deleteCustomer(deleteCustomerForm);
    });
  }
  encodeCustomerId(customerId: number) {
    return btoa(customerId.toString());
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
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get(`tableSearch`) as FormControl;
  }
}
