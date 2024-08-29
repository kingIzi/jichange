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
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { District } from 'src/app/core/models/bank/setup/district';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { WardService } from 'src/app/core/services/bank/setup/ward/ward.service';
import { DistrictService } from 'src/app/core/services/bank/setup/district/district.service';
import { catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { AddWardForm } from 'src/app/core/models/bank/forms/setup/ward/AddWardForm';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

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
export class WardDialogComponent implements OnInit {
  public startLoading: boolean = false;
  //public userProfile!: LoginResponse;
  public wardForm!: FormGroup;
  public districts: District[] = [];
  public addedWard = new EventEmitter<Ward>();
  public PerfomanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddWard', { static: true })
  confirmAddWard!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
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
  private buildPage() {
    this.startLoading = true;
    let countryList = from(this.districtService.getAllDistrictList({}));
    let mergedRes = zip(countryList);
    let res = AppUtilities.pipedObservables(mergedRes);
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
      userid: this.fb.control(this.appConfig.getUserIdFromSessionStorage(), [
        Validators.required,
      ]),
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
      userid: this.fb.control(this.appConfig.getUserIdFromSessionStorage(), [
        Validators.required,
      ]),
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
  private switchInsertWardErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.ward_name.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing ward'.toLocaleUpperCase():
        return this.tr.translate(`setup.wardDialog.form.dialog.missingWard`);
      case 'Missing region'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.districtDialog.form.dialog.missingRegion`
        );
      case 'Missing district'.toLocaleLowerCase():
      case 'District not found'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.wardDialog.form.dialog.missingDistrict`
        );
      case 'Missing status'.toLocaleLowerCase():
        return this.tr.translate(`setup.wardDialog.form.dialog.missingStatus`);
      case 'Missing SNO'.toLocaleLowerCase():
      case 'Missing user id'.toLocaleLowerCase():
        return this.tr.translate(`errors.missingUserIdMessage`);
      default:
        return this.tr.translate(`setup.wardDialog.failedToAddWard`);
    }
  }
  private parseInsertWardResponse(
    result: HttpDataResponse<number | Ward>,
    successMessage: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchInsertWardErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      AppUtilities.showSuccessMessage(
        successMessage,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      this.addedWard.emit(result.response as Ward);
    }
  }
  private requestInsertWard(body: AddWardForm, successMessage: string) {
    this.startLoading = true;
    this.wardService
      .insertWard(body)
      .then((result) => {
        this.parseInsertWardResponse(result, successMessage);
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
    if (this.wardForm.valid) {
      this.confirmAddWard.nativeElement.showModal();
    } else {
      this.wardForm.markAllAsTouched();
    }
  }
  addWard() {
    if (this.data.ward) {
      this.requestInsertWard(
        this.wardForm.value,
        this.tr.translate(`setup.wardDialog.modifiedWardSuccessfully`)
      );
    } else {
      this.requestInsertWard(
        this.wardForm.value,
        this.tr.translate(`setup.wardDialog.addedWardSuccessfully`)
      );
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
