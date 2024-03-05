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
import { RegionDialogComponent } from '../region-dialog/region-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-deposit-account-dialog',
  templateUrl: './deposit-account-dialog.component.html',
  styleUrls: ['./deposit-account-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DepositAccountDialogComponent implements OnInit {
  public depositAccountForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegionDialogComponent>,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  submitDepositForm() {
    if (this.depositAccountForm.valid) {
      this.isLoading.emit(this.depositAccountForm.value);
    }
    this.depositAccountForm.markAllAsTouched();
    this.formErrors();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  private formErrors(errorsPath: string = 'setup.depositAccount.form.dialog') {
    if (this.vendor.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.vendor`)
      );
    }
    if (this.account.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.account`)
      );
    }
    if (this.reason.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.reason`)
      );
    }
  }
  private createForm() {
    this.depositAccountForm = this.fb.group({
      vendor: this.fb.control('', [Validators.required]),
      account: this.fb.control('', [Validators.required]),
      reason: this.fb.control('', [Validators.required]),
    });
  }
  get vendor() {
    return this.depositAccountForm.get('vendor') as FormControl;
  }
  get account() {
    return this.depositAccountForm.get('account') as FormControl;
  }
  get reason() {
    return this.depositAccountForm.get('reason') as FormControl;
  }
}
