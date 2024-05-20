import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { Country } from 'src/app/core/models/bank/setup/country';
import { environment } from 'src/environments/environment';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CountryService } from 'src/app/core/services/bank/setup/country/country.service';
import { AddCountryForm } from 'src/app/core/models/bank/forms/setup/country/add-country-form';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

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
    LoaderInfiniteSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class CountryDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public countryForm!: FormGroup;
  public addedCountry = new EventEmitter<void>();
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
    private countryService: CountryService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      country: Country;
    }
  ) {}
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
  private formErrors(errorsPath: string = 'setup.countryDialog.form.dialog') {
    if (this.country_name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingCountry`)
      );
    }
  }
  private requestAddCountry(form: AddCountryForm) {
    this.startLoading = true;
    this.countryService
      .addCountry(form)
      .then((result) => {
        if (
          result.response &&
          typeof result.response === 'number' &&
          result.response > 0
        ) {
          let m = AppUtilities.sweetAlertSuccessMessage(
            this.translocoService.translate(
              `setup.countryDialog.form.dialog.addedSuccessfully`
            )
          );
          m.then((res) => {
            this.addedCountry.emit();
          });
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    if (this.data && this.data.country) {
      this.editForm(this.data.country);
    } else {
      this.createForm();
    }
  }
  setCountryValue(value: string) {
    this.country_name.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitCountryForm() {
    if (this.countryForm.valid) {
      this.requestAddCountry(this.countryForm.value);
      //this.addedCountry.emit(this.countryForm.value);
    } else {
      this.countryForm.markAllAsTouched();
    }
    //this.formErrors();
  }
  get country_name() {
    return this.countryForm.get('country_name') as FormControl;
  }
}
