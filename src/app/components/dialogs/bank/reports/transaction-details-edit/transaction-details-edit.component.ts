import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import * as json from 'src/assets/temp/data.json';

@Component({
  selector: 'app-transaction-details-edit',
  templateUrl: './transaction-details-edit.component.html',
  styleUrls: ['./transaction-details-edit.component.scss'],
  standalone: true,
  imports: [TranslocoModule, CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class TransactionDetailsEditComponent implements OnInit {
  public formGroup!: FormGroup;
  public transactionsData: any[] = [];
  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      transaction: any;
    }
  ) {}
  private createEditFormGroup(transaction: any) {
    this.formGroup = this.fb.group({
      transactionNo: this.fb.control(transaction.transactionNumber, [
        Validators.required,
      ]),
      date: this.fb.control(
        AppUtilities.dateToFormat(
          AppUtilities.convertDotNetJsonDateToDate(transaction.date),
          'yyyy-MM-dd'
        ),
        [Validators.required]
      ),
      company: this.fb.control(transaction.company, [Validators.required]),
      amount: this.fb.control(transaction.amount, [Validators.required]),
      currency: this.fb.control(transaction.currency, [Validators.required]),
    });
  }
  ngOnInit(): void {
    let data = JSON.parse(JSON.stringify(json));
    this.transactionsData = data.transactionDetails;
    if (!this.data) {
    } else if (this.data.transaction) {
      this.createEditFormGroup(this.data.transaction);
    }
  }
  get transactionNo() {
    return this.formGroup.get('transactionNo') as FormControl;
  }
  get date() {
    return this.formGroup.get('date') as FormControl;
  }
  get company() {
    return this.formGroup.get('company') as FormControl;
  }
  get amount() {
    return this.formGroup.get('amount') as FormControl;
  }
  get currency() {
    return this.formGroup.get('currency') as FormControl;
  }
}
