import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@ngneat/transloco';
import { CustomerReceiptDialogComponent } from 'src/app/components/dialogs/Vendors/customer-receipt-dialog/customer-receipt-dialog.component';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import * as json from 'src/assets/temp/data.json';
import { Collapse, initTE } from 'tw-elements';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-transaction-details-view',
  templateUrl: './transaction-details-view.component.html',
  styleUrls: ['./transaction-details-view.component.scss'],
  standalone: true,
  imports: [TranslocoModule, CommonModule, MatDialogModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class TransactionDetailsViewComponent implements OnInit, AfterViewInit {
  public detail: any;
  public downloading: boolean = false;
  @ViewChild('rootElement') rootElement!: ElementRef;
  @ViewChild('downloadBtn') downloadBtn!: ElementRef;
  constructor(
    private activatedRoute: ActivatedRoute,
    private fileHandler: FileHandlerService,
    private dialog: MatDialog
  ) {}
  ngOnInit(): void {
    initTE({ Collapse });
    let data = JSON.parse(JSON.stringify(json));
    this.activatedRoute.params.subscribe((params) => {
      if (Number(params['id']) >= 0) {
        this.detail = (data.transactionDetails as any[]).find(
          (detail, index) => {
            return index === Number(params['id']);
          }
        );
      }
    });
    this.activatedRoute.queryParams.subscribe((q) => {
      if (q['download']) {
        this.downloading = q['download'];
      }
    });
  }
  ngAfterViewInit(): void {
    this.activatedRoute.queryParams.subscribe((q) => {
      if (q['download']) {
        this.downloading = q['download'];
        let divs = this.rootElement.nativeElement as HTMLDivElement;
        let items = divs.querySelectorAll('[data-te-collapse-item]');
        items.forEach((item) => {
          item.classList.remove('hidden');
        });
        this.downloadPdf();
      }
    });
  }
  downloadPdf() {
    let btn = this.downloadBtn.nativeElement as HTMLButtonElement;
    btn.classList.add('hidden');
    let divs = this.rootElement.nativeElement as HTMLDivElement;
    this.fileHandler
      .downloadPdf(
        this.rootElement.nativeElement as HTMLDivElement,
        'transaction.pdf'
      )
      .then(() => {
        btn.classList.remove('hidden');
      })
      .catch((err) => {
        btn.classList.remove('hidden');
      });
  }
  moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  convertDotNetJSONDate(dotNetJSONDate: string) {
    const timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp);
  }
  downloadCustomerReceipt(
    receipt: any = JSON.parse(JSON.stringify(json)).customerInvoices[0]
      .receipts[0]
  ) {
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
}
