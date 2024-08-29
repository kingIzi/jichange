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
import { District } from 'src/app/core/models/bank/setup/district';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { RegionService } from 'src/app/core/services/bank/setup/region/region.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { Region } from 'src/app/core/models/bank/setup/region';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { AddDistrictForm } from 'src/app/core/models/bank/forms/setup/district/add-district-form';
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
export class DistrictDialogComponent implements OnInit {
  public districtForm!: FormGroup;
  public startLoading: boolean = false;
  public regions: Region[] = [];
  public addedDistrict = new EventEmitter<District>();
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddDistrict', { static: true })
  confirmAddDistrict!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DistrictDialogComponent>,
    private translocoService: TranslocoService,
    private tr: TranslocoService,
    private districtService: DistrictService,
    private regionService: RegionService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { district: District }
  ) {}
  private switchInsertDistrictErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.district_name.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing district name'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.districtDialog.form.dialog.missingDistrict`
        );
      case 'Missing region'.toLocaleLowerCase():
      case 'Region not found'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.districtDialog.form.dialog.missingRegion`
        );
      case 'Missing status'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.districtDialog.form.dialog.missingStatus`
        );
      case 'Missing SNO'.toLocaleLowerCase():
      case 'Missing Dummy'.toLocaleLowerCase():
        return this.tr.translate(`errors.missingUserIdMessage`);
      default:
        return this.tr.translate(`setup.districtDialog.failedToAddDistrict`);
    }
  }
  private parseInsertDistrictResponse(
    result: HttpDataResponse<number | District>,
    successMessage: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchInsertDistrictErrorMessage(
        result.message[0]
      );
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
      this.addedDistrict.emit(result.response as District);
    }
  }
  private requestInsertDistrict(body: AddDistrictForm, message: string) {
    this.startLoading = true;
    this.districtService
      .insertDistrict(body)
      .then((result) => {
        this.parseInsertDistrictResponse(result, message);
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
  private buildPage() {
    this.startLoading = true;
    let countryList = from(this.regionService.getAllRegionsList({}));
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
        let [regions] = results;
        if (
          regions.response &&
          typeof regions.response !== 'string' &&
          typeof regions.response !== 'number'
        ) {
          this.regions = regions.response;
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
  private formErrors(errorsPath: string = 'setup.districtDialog.form.dialog') {
    if (this.district_name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingDistrict`)
      );
    }
    if (this.region_id.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingRegion`)
      );
    }
    if (this.district_status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.districtForm = this.fb.group({
      region_id: this.fb.control('', [Validators.required]),
      district_name: this.fb.control('', [Validators.required]),
      district_status: this.fb.control('', [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      sno: this.fb.control(0, [Validators.required]),
      dummy: this.fb.control(true, []),
    });
  }
  private createEditForm(district: District) {
    this.districtForm = this.fb.group({
      region_id: this.fb.control(district.Region_Id, [Validators.required]),
      district_name: this.fb.control(district.District_Name, [
        Validators.required,
      ]),
      district_status: this.fb.control(district.District_Status, [
        Validators.required,
      ]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      sno: this.fb.control(district.SNO, [Validators.required]),
      dummy: this.fb.control(true, []),
    });
  }
  ngOnInit(): void {
    this.buildPage();
    if (!this.data.district) {
      this.createForm();
    } else {
      this.createEditForm(this.data.district);
    }
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitRegionForm() {
    if (this.districtForm.valid) {
      this.confirmAddDistrict.nativeElement.showModal();
    } else {
      this.districtForm.markAllAsTouched();
    }
  }
  addDistrict() {
    if (!this.data?.district) {
      this.requestInsertDistrict(
        this.districtForm.value,
        this.tr.translate(`setup.districtDialog.addedDistrictSuccessfully`)
      );
    } else {
      this.requestInsertDistrict(
        this.districtForm.value,
        this.tr.translate(`setup.districtDialog.modifiedDistrictSuccessfully`)
      );
    }
  }
  get district_name() {
    return this.districtForm.get('district_name') as FormControl;
  }
  get region_id() {
    return this.districtForm.get('region_id') as FormControl;
  }
  get district_status() {
    return this.districtForm.get('district_status') as FormControl;
  }
}
