import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
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
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

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
  public customerInvoices: CustomerInvoice[] = [];
  public customerInvoicesData: CustomerInvoice[] = [];
  public headerFormGroup!: FormGroup;
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  constructor(
    private fb: FormBuilder,
    private translocoService: TranslocoService,
    private dialog: MatDialog,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private buildFormHeaders() {
    this.headerFormGroup = this.fb.group({
      headers: this.fb.array([], []),
    });
    this.translocoService
      .selectTranslate('customerView.customerInvoicesTable', {}, this.scope)
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
    // let data = JSON.parse(JSON.stringify(json));
    // this.customerInvoicesData = data.customerInvoices;
    // this.customerInvoices = this.customerInvoicesData;
    this.buildFormHeaders();
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
  itemsPerPageChanged(value: string) {
    if (this.itemsPerPage.indexOf(+value) !== -1) {
      this.itemPerPage = +value;
    }
  }
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
}
