import { CommonModule } from '@angular/common';
import {
  Component,
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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Branch } from '@langchain/core/runnables';
import { Country } from 'src/app/core/models/bank/country';
import { environment } from 'src/environments/environment';
import { LoginResponse } from 'src/app/core/models/login-response';

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
  public addedCountry = new EventEmitter<Country>();
  private userProfile = JSON.parse(
    localStorage.getItem('userProfile') as string
  ) as LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private translocoService: TranslocoService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      country: Country;
    }
  ) {}
  ngOnInit(): void {
    if (this.data && this.data.country) {
      this.editForm(this.data.country);
    } else {
      this.createForm();
    }
  }
  private createForm() {
    this.countryForm = this.fb.group({
      country_name: this.fb.control('', [Validators.required]),
      dummy: this.fb.control(environment.production ? false : true, [
        Validators.required,
      ]),
      sno: this.fb.control(0, [Validators.required]),
      Auditby: this.fb.control(this.userProfile.Usno.toString(), [
        Validators.required,
      ]),
    });
  }
  private editForm(country: Country) {
    this.countryForm = this.fb.group({
      country_name: this.fb.control(country.Country_Name, [
        Validators.required,
      ]),
      dummy: this.fb.control(environment.production ? false : true, [
        Validators.required,
      ]),
      sno: this.fb.control(country.SNO, [Validators.required]),
      Auditby: this.fb.control(this.userProfile.Usno.toString(), [
        Validators.required,
      ]),
    });
  }
  setCountryValue(value: string) {
    this.country_name.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  private formErrors(errorsPath: string = 'setup.countryDialog.form.dialog') {
    if (this.country_name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingCountry`)
      );
    }
  }
  submitCountryForm() {
    if (this.countryForm.valid) {
      this.addedCountry.emit(this.countryForm.value);
    }
    this.countryForm.markAllAsTouched();
    this.formErrors();
  }
  get country_name() {
    return this.countryForm.get('country_name') as FormControl;
  }
}
