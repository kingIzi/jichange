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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { LoginResponse } from 'src/app/core/models/login-response';
import { District } from 'src/app/core/models/bank/setup/district';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { WardService } from 'src/app/core/services/bank/setup/ward/ward.service';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { AddWardForm } from 'src/app/core/models/bank/forms/setup/ward/AddWardForm';

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
export class WardDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public userProfile!: LoginResponse;
  public wardForm!: FormGroup;
  public districts: District[] = [];
  public addedWard = new EventEmitter<any>();
  public PerfomanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WardDialogComponent>,
    private wardService: WardService,
    private districtService: DistrictService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      ward: Ward;
    }
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private buildPage() {
    this.startLoading = true;
    let countryList = from(this.districtService.getAllDistrictList({}));
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
        let [districts] = results;
        if (
          districts.response &&
          typeof districts.response !== 'string' &&
          typeof districts.response !== 'number'
        ) {
          this.districts = districts.response;
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
  private formErrors(errorsPath: string = 'setup.wardDialog.form.dialog') {
    if (this.district_sno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingDistrict`)
      );
    }
    if (this.ward_name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingWard`)
      );
    }
    if (this.ward_status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.wardForm = this.fb.group({
      district_sno: this.fb.control('', [Validators.required]),
      region_id: this.fb.control('', []),
      sno: this.fb.control(0, []),
      ward_name: this.fb.control('', [Validators.required]),
      ward_status: this.fb.control('', [Validators.required]),
      dummy: this.fb.control(true, []),
    });
    this.districtChangedEventListener();
  }
  private createEditForm(ward: Ward) {
    this.wardForm = this.fb.group({
      district_sno: this.fb.control(ward.District_Sno, [Validators.required]),
      region_id: this.fb.control(ward.Region_Id, []),
      sno: this.fb.control(ward.SNO, []),
      ward_name: this.fb.control(ward.Ward_Name, [Validators.required]),
      ward_status: this.fb.control(ward.Ward_Status, [Validators.required]),
      dummy: this.fb.control(true, []),
    });
    this.districtChangedEventListener();
  }
  private districtChangedEventListener() {
    this.district_sno.valueChanges.subscribe((value) => {
      let district = this.districts.find((d) => d.SNO == value);
      if (district) {
        this.region_id.setValue(district.Region_Id);
      }
    });
  }
  private requestInsertWard(body: AddWardForm, successMessage: string) {
    this.startLoading = true;
    this.wardService
      .insertWard(body)
      .then((result) => {
        if (result.response && typeof result.response !== 'boolean') {
          let sal = AppUtilities.sweetAlertSuccessMessage(successMessage);
          sal.then((res) => {
            this.addedWard.emit();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.wardDialog.failedToAddWard`)
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
  ngOnInit(): void {
    this.parseUserProfile();
    this.buildPage();
    if (this.data.ward) {
      this.createEditForm(this.data.ward);
    } else {
      this.createForm();
    }
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitWardForm() {
    if (this.wardForm.valid && this.data.ward) {
      this.requestInsertWard(
        this.wardForm.value,
        this.tr.translate(`setup.wardDialog.modifiedWardSuccessfully`)
      );
    } else if (this.wardForm.valid && !this.data.ward) {
      this.requestInsertWard(
        this.wardForm.value,
        this.tr.translate(`setup.wardDialog.addedWardSuccessfully`)
      );
    } else {
      this.wardForm.markAllAsTouched();
    }
  }
  get district_sno() {
    return this.wardForm.get('district_sno') as FormControl;
  }
  get ward_name() {
    return this.wardForm.get('ward_name') as FormControl;
  }
  get ward_status() {
    return this.wardForm.get('ward_status') as FormControl;
  }
  get region_id() {
    return this.wardForm.get('region_id') as FormControl;
  }
}
