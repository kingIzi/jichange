import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { InvoiceDetailsGraphComponent } from 'src/app/components/dialogs/invoice-details-graph/invoice-details-graph.component';
import { Datepicker, Input, initTE } from 'tw-elements';

@Component({
  selector: 'app-invoice-details',
  templateUrl: './invoice-details.component.html',
  styleUrls: ['./invoice-details.component.scss'],
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatDialogModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class InvoiceDetailsComponent implements OnInit {
  public itemsPerPage: number[] = [5, 10, 20];
  public itemPerPage: number = this.itemsPerPage[0];
  public invoiceDetails: any[] = [];
  constructor(private dialog: MatDialog) {}
  ngOnInit(): void {
    initTE({ Datepicker, Input });
  }
  // openInvoiceDetailsGraph() {
  //   let dialogRef = this.dialog.open(InvoiceDetailsGraphComponent, {
  //     width: '800px',
  //   });
  //   dialogRef.afterClosed().subscribe((result) => {
  //     console.log(`Dialog result: ${result}`);
  //   });
  // }
  openInvoiceDetailsGraph() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: {},
        headers: [],
        generatedInvoices: [],
      },
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
}
