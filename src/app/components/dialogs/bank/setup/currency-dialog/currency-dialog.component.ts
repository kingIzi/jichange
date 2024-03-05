import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { MatDialogRef } from '@angular/material/dialog';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-currency-dialog',
  templateUrl: './currency-dialog.component.html',
  styleUrls: ['./currency-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class CurrencyDialogComponent implements OnInit {
  public currencyForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CurrencyDialogComponent>,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setCurrencyValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  submitCurrencyForm() {
    if (this.currencyForm.valid) {
      this.isLoading.emit(this.currencyForm.value);
    }
    this.currencyForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.currency.form.dialog') {
    if (this.currency.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingName`)
      );
    }
    if (this.code.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingCode`)
      );
    }
  }
  private createForm() {
    this.currencyForm = this.fb.group({
      currency: this.fb.control('', [Validators.required]),
      code: this.fb.control('', [Validators.required]),
    });
  }
  get currency() {
    return this.currencyForm.get('currency') as FormControl;
  }
  get code() {
    return this.currencyForm.get('code') as FormControl;
  }
}
