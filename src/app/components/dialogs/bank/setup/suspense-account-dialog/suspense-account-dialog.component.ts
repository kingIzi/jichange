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
import { CountryDialogComponent } from '../country-dialog/country-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-suspense-account-dialog',
  templateUrl: './suspense-account-dialog.component.html',
  styleUrls: ['./suspense-account-dialog.component.scss'],
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
export class SuspenseAccountDialogComponent implements OnInit {
  public suspenseAccountForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setCountryValue(value: string) {
    this.suspenseAccountNo.setValue(value.trim());
  }
  submitSuspenseAccountForm() {
    if (this.suspenseAccountForm.valid) {
      this.isLoading.emit(this.suspenseAccountForm.value);
    }
    this.suspenseAccountForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.suspenseAccount.form.dialog') {
    if (this.suspenseAccountNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.suspenseAccount`)
      );
    }
    if (this.status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.suspenseAccountForm = this.fb.group({
      suspenseAccountNo: this.fb.control('', [Validators.required]),
      status: this.fb.control(false, [Validators.required]),
    });
  }
  get suspenseAccountNo() {
    return this.suspenseAccountForm.get('suspenseAccountNo') as FormControl;
  }
  get status() {
    return this.suspenseAccountForm.get('status') as FormControl;
  }
}
