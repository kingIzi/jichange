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
  selector: 'app-district-dialog',
  templateUrl: './district-dialog.component.html',
  styleUrls: ['./district-dialog.component.scss'],
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
export class DistrictDialogComponent implements OnInit {
  public districtForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DistrictDialogComponent>,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setDistrictValue(value: string) {
    this.district.setValue(value.trim());
  }
  submitRegionForm() {
    if (this.districtForm.valid) {
      this.isLoading.emit(this.districtForm.value);
    }
    this.districtForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.districtDialog.form.dialog') {
    if (this.district.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingDistrict`)
      );
    }
    if (this.region.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingRegion`)
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
    this.districtForm = this.fb.group({
      region: this.fb.control('', [Validators.required]),
      district: this.fb.control('', [Validators.required]),
      status: this.fb.control(false, [Validators.required]),
    });
  }
  get district() {
    return this.districtForm.get('district') as FormControl;
  }
  get region() {
    return this.districtForm.get('region') as FormControl;
  }
  get status() {
    return this.districtForm.get('status') as FormControl;
  }
}
