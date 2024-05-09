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
  public customersData: Customer[] = [];
  public customers: Customer[] = [];
  public headersFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  //public customers: { Cus_Mas_Sno: number; Customer_Name: string }[] = [];
  private headersMap = {
    customerName: 0,
    emailId: 1,
    mobileNo: 2,
  };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private reportService: ReportsService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private requestCustomerNames() {
    this.startLoading = true;
    this.reportService
      .postCustomerDetailsReport({
        Comp: this.userProfile.InstID.toString(),
        reg: '0',
        dist: '0',
      })
      .then((results: any) => {
        this.customersData = results.response === 0 ? [] : results.response;
        this.customers = this.customersData;
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.cdr.detectChanges();
        throw err;
      });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case this.headersMap.customerName:
        this.customers.sort((a, b) =>
          a.Cust_Name.trim().toLocaleLowerCase() >
          b.Cust_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.emailId:
        this.customers.sort((a, b) =>
          a.Email.trim().toLocaleLowerCase() >
          b.Email.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.mobileNo:
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
      case this.headersMap.customerName:
        this.customers.sort((a, b) =>
          a.Cust_Name.trim().toLocaleLowerCase() <
          b.Cust_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.emailId:
        this.customers.sort((a, b) =>
          a.Email.trim().toLocaleLowerCase() <
          b.Email.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case this.headersMap.mobileNo:
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
    });
    this.tr
      .selectTranslate('customersTable', {}, this.scope)
      .subscribe((headers: string[]) => {
        if (headers && headers.length > 0) {
          headers.forEach((element) => {
            let header = this.fb.group({
              label: this.fb.control(element, []),
              sortAsc: this.fb.control('', []),
            });
            this.headers.push(header);
          });
        }
      });
  }
  ngOnInit(): void {
    this.buildHeadersForm();
    this.parseUserProfile();
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
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  openCustomerEditDialog(customer: Customer) {
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      data: customer,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  openRemoveDialog(id: number, removeClient: RemoveItemDialogComponent) {
    removeClient.title = 'Confirm';
    removeClient.message = 'Are you sure you want to delete this customer?';
    removeClient.openDialog();
    removeClient.remove.asObservable().subscribe((event) => {
      this.customers.splice(id, 1);
      this.successMessageBox.title = 'Customer deleted successfully';
      this.successMessageBox.openDialog();
    });
  }
  searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
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
      paginator.firstPage();
    } else {
      this.customers = this.customersData;
    }
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
}
