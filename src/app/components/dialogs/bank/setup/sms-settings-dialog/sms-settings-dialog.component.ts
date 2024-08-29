import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { PhoneNumberInputComponent } from '../../../../../reusables/phone-number-input/phone-number-input.component';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { OptionalConfirmMessageBoxComponent } from '../../../optional-confirm-message-box/optional-confirm-message-box.component';
import { SmsSettingsService } from 'src/app/core/services/bank/setup/sms-settings/sms-settings.service';
import { SMSSettingsForm } from 'src/app/core/models/bank/forms/setup/sms-settings/sms-settings';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { LoaderInfiniteSpinnerComponent } from '../../../../../reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import {
  SmsSetting,
  SmsSettingsData,
} from 'src/app/core/models/bank/setup/sms-setting';
import { from, Observable, of, zip } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

@Component({
  selector: 'app-sms-settings-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    PhoneNumberInputComponent,
    OptionalConfirmMessageBoxComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './sms-settings-dialog.component.html',
  styleUrl: './sms-settings-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class SmsSettingsDialogComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public addedSmsSetting = new EventEmitter<SmsSettingsData>();
  public formGroup!: FormGroup;
  public smsSettingsData!: Observable<SmsSettingsData>;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('insertConfirmMessageBox')
  insertConfirmMessageBox!: OptionalConfirmMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private smsSettingsService: SmsSettingsService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private dialogRef: MatDialogRef<SmsSettingsDialogComponent>,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { smsId: number }
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group({
      smtp_uname: this.fb.control<string>('', [Validators.required]),
      from_address: this.fb.control<string>('', [Validators.required]),
      smtp_pwd: this.fb.control<string>('', [Validators.required]),
      smtp_mob: this.fb.control<string>('', [Validators.required]),
      sno: this.fb.control<number>(0, [Validators.required]),
      userid: this.fb.control<number>(
        this.appConfig.getUserIdFromSessionStorage(),
        [Validators.required]
      ),
    });
  }
  private addInsertSmsSettingEventHandler() {
    this.insertConfirmMessageBox.defaultChoice.asObservable().subscribe({
      next: (result) => {
        if (this.data) {
          let msg = this.tr.translate(
            'setup.smsSettings.successfullyModifiedSmsSetting'
          );
          this.requestAddSmsSetting(this.formGroup.getRawValue(), msg);
        } else {
          let msg = this.tr.translate(
            'setup.smsSettings.successfullyAddedSmsSetting'
          );
          this.requestAddSmsSetting(this.formGroup.getRawValue(), msg);
        }
      },
      error: (err) => {
        throw err;
      },
    });
  }
  private switchAddSmsSettingErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Flow'
    );
    switch (errorMessage.toLocaleLowerCase()) {
      case 'Flow Id already exists'.toLocaleLowerCase():
        return this.tr.translate(`setup.smsSettings.flowIdExists`);
      default:
        return this.tr.translate('setup.smsSettings.failedToModifySmsSettings');
    }
  }
  private switchFindSmsSettingErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      ''
    );
    switch (errorMessage.toLocaleLowerCase()) {
      default:
        return this.tr.translate('setup.smsSettings.failedToFetchSmsSetting');
    }
  }
  private parseFindSmsSettingResponse(
    result: HttpDataResponse<number | SmsSettingsData>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      let errorMessage = this.switchFindSmsSettingErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      this.smsSettingsData = of(result.response as SmsSettingsData);
      this.smsSettingsData.subscribe({
        next: (form) => {
          this.smtp_uname.setValue(form.USER_Name ?? '');
          this.from_address.setValue(form.From_Address ?? '');
          this.smtp_pwd.setValue(form.Password ?? '');
          this.smtp_mob.setValue(form.Mobile_Service ?? '');
          this.userid.setValue(this.appConfig.getUserIdFromSessionStorage());
          this.sno.setValue(form.SNO);
          this.smtp_pwd.disable();
        },
        error: (err) => {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate('defaults.warning'),
            this.tr.translate('setup.smsSettings.failedToFetchSmsSetting')
          );
          throw err;
        },
      });

      this.cdr.detectChanges();
    }
  }
  private parseAddSmsSettingResponse(
    result: HttpDataResponse<number | SmsSettingsData>,
    message: string
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      let errorMessage = this.switchAddSmsSettingErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      AppUtilities.showSuccessMessage(
        message,
        (e) => {},
        this.tr.translate('actions.ok')
      );
      this.addedSmsSetting.emit(result.response as SmsSettingsData);
    }
  }
  private requestAddSmsSetting(form: SMSSettingsForm, message: string) {
    this.startLoading = true;
    this.smsSettingsService.insertSmsSetting(form).subscribe({
      next: (result) => {
        this.parseAddSmsSettingResponse(result, message);
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  private buildPage() {
    let smsSetting = from(
      this.smsSettingsService.findSmsSecurityById(this.data.smsId)
    );
    let sms = zip(smsSetting);
    sms.subscribe({
      next: (results) => {
        let [smsSetting] = results;
        this.parseFindSmsSettingResponse(smsSetting);
        this.startLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      },
    });
  }
  ngOnInit(): void {
    this.createFormGroup();
  }
  ngAfterViewInit(): void {
    this.addInsertSmsSettingEventHandler();
    if (this.data) {
      this.buildPage();
    }
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitSmsSetting() {
    if (this.formGroup.valid) {
      this.insertConfirmMessageBox.openDialog();
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get smtp_uname() {
    return this.formGroup.get('smtp_uname') as FormControl;
  }
  get from_address() {
    return this.formGroup.get('from_address') as FormControl;
  }
  get smtp_pwd() {
    return this.formGroup.get('smtp_pwd') as FormControl;
  }
  get smtp_mob() {
    return this.formGroup.get('smtp_mob') as FormControl;
  }
  get sno() {
    return this.formGroup.get('sno') as FormControl;
  }
  get userid() {
    return this.formGroup.get('userid') as FormControl;
  }
}
