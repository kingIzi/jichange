import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';

@Component({
  selector: 'app-country-dialog',
  templateUrl: './country-dialog.component.html',
  styleUrls: ['./country-dialog.component.scss'],
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
export class CountryDialogComponent implements OnInit {
  public countryForm!: FormGroup;
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

  private createForm() {
    this.countryForm = this.fb.group({
      country: this.fb.control('', [Validators.required]),
    });
  }

  setCountryValue(value: string) {
    this.country.setValue(value.trim());
  }

  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }

  private formErrors(errorsPath: string = 'setup.countryDialog.form.dialog') {
    if (this.country.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingCountry`)
      );
    }
  }

  submitCountryForm() {
    if (this.countryForm.valid) {
      this.isLoading.emit(this.countryForm.value);
    }
    this.countryForm.markAllAsTouched();
    this.formErrors();
  }

  get country() {
    return this.countryForm.get('country') as FormControl;
  }
}
