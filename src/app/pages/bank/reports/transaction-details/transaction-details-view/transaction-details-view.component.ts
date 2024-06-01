import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { from, zip } from 'rxjs';
import { CustomerReceiptDialogComponent } from 'src/app/components/dialogs/Vendors/customer-receipt-dialog/customer-receipt-dialog.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import * as json from 'src/assets/temp/data.json';
import { Collapse, initTE } from 'tw-elements';
import { BreadcrumbService } from 'xng-breadcrumb';

@Component({
  selector: 'app-transaction-details-view',
  templateUrl: './transaction-details-view.component.html',
  styleUrls: ['./transaction-details-view.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    CommonModule,
    MatDialogModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class TransactionDetailsViewComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public detail: any;
  public downloading: boolean = false;
  public payments: TransactionDetail[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('rootElement') rootElement!: ElementRef;
  @ViewChild('downloadBtn') downloadBtn!: ElementRef;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private activatedRoute: ActivatedRoute,
    private reportsService: ReportsService,
    private tr: TranslocoService,
    private fileHandler: FileHandlerService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}
  private buildPage(invoice_number: string) {
    this.startLoading = true;
    let paymentsObs = from(
      this.reportsService.getInvoicePaymentDetails({
        invoice_sno: invoice_number,
      })
    );
    let res = AppUtilities.pipedObservables(zip(paymentsObs));
    res
      .then((results) => {
        let [payments] = results;
        if (
          typeof payments.response !== 'number' &&
          typeof payments.response !== 'string'
        ) {
          this.payments = payments.response;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
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
  ngOnInit(): void {
    initTE({ Collapse });
    this.activatedRoute.params.subscribe((params) => {
      if (params['id']) {
        let invno = atob(params['id']);
        this.buildPage(invno);
      }
    });
  }
  ngAfterViewInit(): void {
    // this.activatedRoute.queryParams.subscribe((q) => {
    //   if (q['download']) {
    //     this.downloading = q['download'];
    //     let divs = this.rootElement.nativeElement as HTMLDivElement;
    //     let items = divs.querySelectorAll('[data-te-collapse-item]');
    //     items.forEach((item) => {
    //       item.classList.remove('hidden');
    //     });
    //     this.downloadPdf();
    //   }
    // });
  }
  downloadPdf(payments: TransactionDetail[]) {
    // let btn = this.downloadBtn.nativeElement as HTMLButtonElement;
    // btn.classList.add('hidden');
    // let divs = this.rootElement.nativeElement as HTMLDivElement;
    // this.fileHandler
    //   .downloadPdf(
    //     this.rootElement.nativeElement as HTMLDivElement,
    //     'transaction.pdf'
    //   )
    //   .then(() => {
    //     btn.classList.remove('hidden');
    //   })
    //   .catch((err) => {
    //     btn.classList.remove('hidden');
    //   });
    let dialogRef = this.dialog.open(CustomerReceiptDialogComponent, {
      width: '800px',
      data: {
        payments: payments,
      },
    });
    dialogRef.afterOpened().subscribe(() => {
      let element = dialogRef.componentInstance.receiptView
        .nativeElement as HTMLDivElement;
      this.fileHandler.downloadPdfRemoveLastPage(
        element,
        `receipts-invoice-${payments.at(0)?.Invoice_Sno}.pdf`
      );
      dialogRef.close();
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
  openReceipt(payment: TransactionDetail) {
    let dialogRef = this.dialog.open(CustomerReceiptDialogComponent, {
      width: '800px',
      data: {
        payments: [payment],
      },
    });
  }
  downloadReceipt(payment: TransactionDetail) {
    let dialogRef = this.dialog.open(CustomerReceiptDialogComponent, {
      width: '800px',
      data: {
        payments: [payment],
      },
    });
    dialogRef.afterOpened().subscribe(() => {
      let element = dialogRef.componentInstance.receiptView
        .nativeElement as HTMLDivElement;
      this.fileHandler.downloadPdfRemoveLastPage(
        element,
        `receipt-${payment.Receipt_No}.pdf`
      );
      dialogRef.close();
    });
  }
}
