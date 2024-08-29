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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Region } from 'src/app/core/models/bank/setup/region';
import {
  validate,
  validator,
} from '@langchain/core/dist/utils/fast-json-patch';
import { Country } from 'src/app/core/models/bank/setup/country';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { RegionService } from 'src/app/core/services/bank/setup/region/region.service';
import { CountryService } from 'src/app/core/services/bank/setup/country/country.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { AddRegionForm } from 'src/app/core/models/bank/forms/setup/region/add-region-form';
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
export class RegionDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public regionForm!: FormGroup;
  public countries: Country[] = [];
  public addedRegion = new EventEmitter<Region>();
  public PerformanceUtils: PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddRegion', { static: true })
  confirmAddRegion!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegionDialogComponent>,
    private tr: TranslocoService,
    private regionService: RegionService,
    private countryService: CountryService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      region: Region;
    }
  ) {}
  private buildPage() {
    this.startLoading = true;
    let countryList = from(this.countryService.getCountryList({}));
    let mergedRes = zip(countryList);
    let res = lastValueFrom(
      mergedRes.pipe(
        map((results) => {
          return results;
        }),
        catchError((err) => {
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        })
      )
    );
    res
      .then((results) => {
        let [countries] = results;
        if (
          countries.response &&
          typeof countries.response !== 'string' &&
          typeof countries.response !== 'number'
        ) {
          this.countries = countries.response;
        }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private createForm() {
    this.regionForm = this.fb.group({
      region: this.fb.control('', [Validators.required]),
      Status: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      csno: this.fb.control('', [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      country: this.fb.control('', []),
    });
  }
  private createEditForm() {
    this.regionForm = this.fb.group({
      region: this.fb.control(this.data.region.Region_Name, [
        Validators.required,
      ]),
      Status: this.fb.control(this.data.region.Region_Status, [
        Validators.required,
      ]),
      sno: this.fb.control(this.data.region.Region_SNO, [Validators.required]),
      csno: this.fb.control(this.data.region.Country_Sno, [
        Validators.required,
      ]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      dummy: this.fb.control(true, [Validators.required]),
      country: this.fb.control('', []),
    });
  }
  private formErrors(errorsPath: string = 'setup.regionDialog.form.dialog') {
    if (this.csno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingCountry`)
      );
    }
    if (this.region.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingRegion`)
      );
    }
    if (this.Status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private switchAddRegionErrorRespones(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.region.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing name'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.regionDialog.form.dialog.missingRegion`
        );
      case 'Country not found'.toLocaleLowerCase():
      case 'Missing country sno'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.regionDialog.form.dialog.missingCountry`
        );
      default:
        return this.tr.translate(`setup.wardDialog.failedToAddWard`);
    }
  }
  private parseAddRegionResponse(
    result: HttpDataResponse<number | Region>,
    successMessage: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchAddRegionErrorRespones(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      AppUtilities.showSuccessMessage(
        successMessage,
        (e) => {},
        this.tr.translate('actions.ok')
      );
      this.addedRegion.emit(result.response as Region);
    }
  }
  private requestAddRegion(body: AddRegionForm, message: string) {
    this.startLoading = true;
    this.regionService
      .addRegion(body)
      .then((result) => {
        this.parseAddRegionResponse(result, message);
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    this.buildPage();
    if (!this.data.region) {
      this.createForm();
    } else {
      this.createEditForm();
    }
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  setRegionValue(value: string) {
    this.region.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitRegionForm() {
    if (this.regionForm.valid) {
      let country = this.countries.find((e) => {
        return e.SNO == this.csno.value;
      });
      this.country.setValue(country?.Country_Name);
      this.confirmAddRegion.nativeElement.showModal();
    } else {
      this.regionForm.markAllAsTouched();
    }
  }
  addRegion() {
    if (!this.data?.region) {
      this.requestAddRegion(
        this.regionForm.value,
        this.tr.translate(`setup.regionDialog.addedRegionSuccessfully`)
      );
    } else {
      this.requestAddRegion(
        this.regionForm.value,
        this.tr.translate(`setup.regionDialog.modifiedReginSuccessfully`)
      );
    }
  }
  get csno() {
    return this.regionForm.get('csno') as FormControl;
  }
  get region() {
    return this.regionForm.get('region') as FormControl;
  }
  get Status() {
    return this.regionForm.get('Status') as FormControl;
  }
  get country() {
    return this.regionForm.get('country') as FormControl;
  }
}
