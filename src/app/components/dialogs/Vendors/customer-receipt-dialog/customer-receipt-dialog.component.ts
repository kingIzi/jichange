import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoModule } from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { from } from 'rxjs';

@Component({
  selector: 'app-customer-receipt-dialog',
  templateUrl: './customer-receipt-dialog.component.html',
  styleUrls: ['./customer-receipt-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    TranslocoModule,
  ],
})
export class CustomerReceiptDialogComponent implements OnInit {
  public formGroups: FormGroup[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('receiptView') receiptView!: ElementRef<HTMLDivElement>;
  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      payments: TransactionDetail[];
    }
  ) {}
  private createReceiptForm(payments: TransactionDetail[]) {
    payments.forEach((payment) => {
      let group = this.fb.group({
        receiptNo: this.fb.control(payment.Receipt_No, []),
        controlNumber: this.fb.control(payment.Control_No, []),
        date: this.fb.control(
          new Date(payment.Payment_Date).toISOString().split('T')[0],
          []
        ),
        to: this.fb.control(payment.Customer_Name, []),
        amount: this.fb.control(
          AppUtilities.moneyFormat(payment.PaidAmount.toString()) +
            ' ' +
            payment.Currency_Code,
          []
        ),
        from: this.fb.control(payment.Payer_Name, []),
        for: this.fb.control(payment.Payment_Desc, []),
        method: this.fb.control(payment.Trans_Channel, []),
        balance: this.fb.control(
          AppUtilities.moneyFormat(payment.Balance.toString()) +
            ' ' +
            payment.Currency_Code,
          []
        ),
        currencyCode: this.fb.control(payment.Currency_Code, []),
      });
      this.formGroups.push(group);
    });
  }
  ngOnInit(): void {
    if (this.data.payments) {
      this.createReceiptForm(this.data.payments);
    }
  }
}
