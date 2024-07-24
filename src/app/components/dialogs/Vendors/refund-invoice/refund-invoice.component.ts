import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { from, zip } from 'rxjs';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-refund-invoice',
  standalone: true,
  templateUrl: './refund-invoice.component.html',
  styleUrl: './refund-invoice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
  ],
})
export class RefundInvoiceComponent implements OnInit {
  public generatedInvoice!: GeneratedInvoice;
  public startLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public formGroup!: FormGroup;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('refundInvoice', { static: true })
  refundInvoice!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RefundInvoiceComponent>,
    private invoiceService: InvoiceService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { invid: number | string }
  ) {}
  private async buildPage(invid: number | string) {
    this.startLoading = true;
    let invoiceById = from(
      this.invoiceService.getGeneratedInvoicebyId({
        compid: this.getUserProfile().InstID,
        invid: invid,
      })
    );
    let merged = zip(invoiceById);
    let res = AppUtilities.pipedObservables(merged);
    res
      .then((results) => {
        let [invoice] = results;
        if (
          typeof invoice.response !== 'string' &&
          typeof invoice.response !== 'number'
        ) {
          this.generatedInvoice = invoice.response;
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
  private createFormGroup() {
    this.formGroup = this.fb.group({});
  }
  ngOnInit(): void {
    this.createFormGroup();
    if (this.data && this.data.invid) {
      this.buildPage(this.data.invid);
    }
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  fullRefundDescription(description: string) {
    if (this.generatedInvoice) {
      let total = AppUtilities.moneyFormat(
        this.generatedInvoice.Total.toString()
      );
      let desc = `( ${total} ${this.generatedInvoice.Currency_Code} )`;
      return description.replace('{}', desc);
    } else {
      return '';
    }
  }
  closeDialog() {
    this.dialogRef.close();
  }
  submitRefund() {
    if (this.formGroup.valid) {
      this.refundInvoice.nativeElement.showModal();
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  refund() {}
}
