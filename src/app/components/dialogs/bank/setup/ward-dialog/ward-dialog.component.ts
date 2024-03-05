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
  selector: 'app-ward-dialog',
  templateUrl: './ward-dialog.component.html',
  styleUrls: ['./ward-dialog.component.scss'],
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
export class WardDialogComponent implements OnInit {
  public wardForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WardDialogComponent>,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  setWardValue(value: string) {
    this.ward.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitWardForm() {
    if (this.wardForm.valid) {
      this.isLoading.emit(this.wardForm.value);
    }
    this.wardForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.wardDialog.form.dialog') {
    if (this.district.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingDistrict`)
      );
    }
    if (this.ward.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingWard`)
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
    this.wardForm = this.fb.group({
      district: this.fb.control('', [Validators.required]),
      ward: this.fb.control('', [Validators.required]),
      status: this.fb.control(false, [Validators.required]),
    });
  }
  get district() {
    return this.wardForm.get('district') as FormControl;
  }
  get ward() {
    return this.wardForm.get('ward') as FormControl;
  }
  get status() {
    return this.wardForm.get('status') as FormControl;
  }
}
