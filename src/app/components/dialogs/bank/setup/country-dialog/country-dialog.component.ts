import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
import { CountryService } from 'src/app/core/services/bank/setup/country/country.service';
import { AddCountryForm } from 'src/app/core/models/bank/forms/setup/country/add-country-form';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
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
  public addedCountry = new EventEmitter<Country>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddCountry', { static: true })
  confirmAddCountry!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private tr: TranslocoService,
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
      Auditby: this.fb.control(this.getUserProfile().Usno.toString(), [
        Validators.required,
      ]),
      userid: this.fb.control(this.getUserProfile().Usno, []),
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
      Auditby: this.fb.control(this.getUserProfile().Usno.toString(), [
        Validators.required,
      ]),
      userid: this.fb.control(this.getUserProfile().Usno, []),
    });
  }
  private formErrors(errorsPath: string = 'setup.countryDialog.form.dialog') {
    if (this.country_name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingCountry`)
      );
    }
  }
  private switchAddCountryErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.country_name.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing user id'.toLocaleLowerCase():
      case 'Missing Audit By'.toLocaleLowerCase():
      case 'Missing SNO'.toLocaleLowerCase():
      case 'Missing dummy'.toLocaleLowerCase():
      case 'Dummy must be true for country updates.':
        return this.tr.translate(`errors.missingUserIdMessage`);
      case 'Missing name':
        return this.tr.translate(
          `setup.countryDialog.form.dialog.missingCountry`
        );
      default:
        return this.tr.translate(`setup.countryDialog.failedToAddCountry`);
    }
  }
  private parseAddCountryResponse(
    result: HttpDataResponse<number | Country>,
    message: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchAddCountryErrorMessage(
        result.message[0].toLocaleLowerCase()
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      //let m = AppUtilities.sweetAlertSuccessMessage(message);
      AppUtilities.showSuccessMessage(
        message,
        (e) => {},
        this.tr.translate('actions.ok')
      );
      this.addedCountry.emit(result.response as Country);
    }
  }
  private requestAddCountry(form: AddCountryForm, message: string) {
    this.startLoading = true;
    this.countryService
      .addCountry(form)
      .then((result) => {
        this.parseAddCountryResponse(result, message);
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
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  setCountryValue(value: string) {
    this.country_name.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitCountryForm() {
    if (this.countryForm.valid) {
      this.confirmAddCountry.nativeElement.showModal();
    } else {
      this.countryForm.markAllAsTouched();
    }
  }
  addCountry() {
    if (!this.data?.country) {
      this.requestAddCountry(
        this.countryForm.value,
        this.tr.translate(`setup.countryDialog.form.dialog.addedSuccessfully`)
      );
    } else {
      this.requestAddCountry(
        this.countryForm.value,
        this.tr.translate(
          `setup.countryDialog.form.dialog.modifiedSuccessfully`
        )
      );
    }
  }
  get country_name() {
    return this.countryForm.get('country_name') as FormControl;
  }
}
