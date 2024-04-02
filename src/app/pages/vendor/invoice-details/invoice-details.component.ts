import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { Customer } from 'src/app/core/models/vendors/customer';
import * as json from 'src/assets/temp/data.json';

@Component({
  selector: 'app-invoice-details',
  templateUrl: './invoice-details.component.html',
  styleUrls: ['./invoice-details.component.scss'],
  standalone: true,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    RouterModule,
    TableDateFiltersComponent,
  ],
})
export class InvoiceDetailsComponent implements OnInit {
  public startLoading: boolean = false;
  public invoiceDetails: any[] = [];
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute
  ) {}
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
    this.activatedRoute.params.subscribe((params) => {
      if (Number(params['customerId'])) {
        let customer = data.customers.find((elem: Customer) => {
          return elem.Cust_Sno === Number(params['customerId']);
        });
        this.openCustomerInvoiceDialog(customer);
      }
    });
    //this.openInvoiceDetailsDialog();
  }
  openInvoiceDetailsDialog() {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
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
}
