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
import { CustomersDialogComponent } from 'src/app/components/dialogs/Vendors/customers-dialog/customers-dialog.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Customer } from 'src/app/core/models/vendors/customer';
import * as json from 'src/assets/temp/data.json';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    RouterModule,
    RemoveItemDialogComponent,
    SuccessMessageBoxComponent,
    FormsModule,
    ReactiveFormsModule,
    TableDateFiltersComponent,
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
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public headersFormGroup!: FormGroup;
  private headersMap = {
    customerName: 0,
    emailId: 1,
    mobileNo: 2,
  };
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private translocoService: TranslocoService,
    private fb: FormBuilder,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
    this.customersData = data.customers;
    this.customers = this.customersData;
    this.buildHeadersForm();
    this.activatedRoute.params.subscribe((params) => {
      if (params['addCustomer']) {
        this.openCustomersDialog();
      }
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
    this.translocoService
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
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  openCustomerEditDialog(customer: Customer) {
    let dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: '800px',
      data: customer,
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
  searchTable(searchText: string) {
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
    } else {
      this.customers = this.customersData;
    }
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
}
