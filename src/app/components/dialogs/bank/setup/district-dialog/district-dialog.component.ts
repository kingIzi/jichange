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
import { LoginResponse } from 'src/app/core/models/login-response';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { RegionService } from 'src/app/core/services/bank/setup/region/region.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { Region } from 'src/app/core/models/bank/setup/region';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { AddDistrictForm } from 'src/app/core/models/bank/forms/setup/district/add-district-form';

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
  public userProfile!: LoginResponse;
  public districtForm!: FormGroup;
  public startLoading: boolean = false;
  public regions: Region[] = [];
  public addedDistrict = new EventEmitter<any>();
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddDistrict', { static: true })
  confirmAddDistrict!: ElementRef<HTMLDialogElement>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DistrictDialogComponent>,
    private translocoService: TranslocoService,
    private tr: TranslocoService,
    private districtService: DistrictService,
    private regionService: RegionService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { district: District }
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private requestInsertDistrict(body: AddDistrictForm, message: string) {
    this.startLoading = true;
    this.districtService
      .insertDistrict(body)
      .then((result) => {
        if (result.response && typeof result.response !== 'boolean') {
          let sal = AppUtilities.sweetAlertSuccessMessage(message);
          this.addedDistrict.emit();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.districtDialog.failedToAddDistrict`)
          );
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
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
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
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      sno: this.fb.control(district.SNO, [Validators.required]),
      dummy: this.fb.control(true, []),
    });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.buildPage();
    if (!this.data.district) {
      this.createForm();
    } else {
      this.createEditForm(this.data.district);
    }
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
