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
  @ViewChild('receiptView') receiptView!: ElementRef;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CustomerReceiptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  private createReceiptForm(receipts: any[]) {
    receipts.forEach((receipt) => {
      let group = this.fb.group({
        receiptNo: this.fb.control(receipt.receiptNo, [Validators.required]),
        controlNumber: this.fb.control(receipt.controlNo, [
          Validators.required,
        ]),
        date: this.fb.control(
          AppUtilities.dateToFormat(
            AppUtilities.convertDotNetJsonDateToDate(receipt.date.toString()),
            'yyyy-MM-dd'
          ),
          [Validators.required]
        ),
        to: this.fb.control(receipt.to, [Validators.required]),
        amount: this.fb.control(
          AppUtilities.moneyFormat(receipt.amount.toFixed(2).toString()) +
            ' /TZS',
          [Validators.required]
        ),
        from: this.fb.control(receipt.from, [Validators.required]),
        for: this.fb.control(receipt.for, [Validators.required]),
        method: this.fb.control(receipt.method, [Validators.required]),
        balance: this.fb.control(receipt.balance.toFixed(2) + ' /TZS', [
          Validators.required,
        ]),
        currencyCode: this.fb.control(receipt.currencyCode, [
          Validators.required,
        ]),
      });
      this.formGroups.push(group);
    });
  }
  ngOnInit(): void {
    if (this.data.receipts) {
      this.createReceiptForm(this.data.receipts);
    }
  }
}
