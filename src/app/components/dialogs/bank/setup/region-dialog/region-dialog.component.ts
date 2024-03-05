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
  selector: 'app-region-dialog',
  templateUrl: './region-dialog.component.html',
  styleUrls: ['./region-dialog.component.scss'],
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
export class RegionDialogComponent implements OnInit {
  public regionForm!: FormGroup;
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
  private createForm() {
    this.regionForm = this.fb.group({
      country: this.fb.control('', [Validators.required]),
      region: this.fb.control('', [Validators.required]),
      status: this.fb.control(false, [Validators.required]),
    });
  }
  setRegionValue(value: string) {
    this.region.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  private formErrors(errorsPath: string = 'setup.regionDialog.form.dialog') {
    if (this.country.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingCountry`)
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
  submitRegionForm() {
    if (this.regionForm.valid) {
      this.isLoading.emit(this.regionForm.value);
    }
    this.regionForm.markAllAsTouched();
    this.formErrors();
  }
  get country() {
    return this.regionForm.get('country') as FormControl;
  }
  get region() {
    return this.regionForm.get('region') as FormControl;
  }
  get status() {
    return this.regionForm.get('status') as FormControl;
  }
}
