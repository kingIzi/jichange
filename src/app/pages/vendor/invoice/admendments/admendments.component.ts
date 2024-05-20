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
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

@Component({
  selector: 'app-admendments',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    RouterModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './admendments.component.html',
  styleUrl: './admendments.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class AdmendmentsComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public invoicesList: any[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
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
