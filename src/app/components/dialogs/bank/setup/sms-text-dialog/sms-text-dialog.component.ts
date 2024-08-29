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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddSmsTextForm } from 'src/app/core/models/bank/forms/setup/sms-text/sms-text';
import {
  EmailText,
  EmailTextFlow,
} from 'src/app/core/models/bank/setup/email-text';
import { SmsText } from 'src/app/core/models/bank/setup/sms-text';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { EmailTextService } from 'src/app/core/services/bank/setup/email-text/email-text.service';
import { from, Observable, of, zip } from 'rxjs';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { SmsTextService } from 'src/app/core/services/bank/setup/sms-text/sms-text.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-sms-text-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
  ],
  templateUrl: './sms-text-dialog.component.html',
  styleUrl: './sms-text-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmsTextDialogComponent implements OnInit, AfterViewInit {
  public startLoading: boolean = false;
  public addedSmsText = new EventEmitter<SmsText>();
  public formGroup!: FormGroup;
  public flows: EmailTextFlow[] = [];
  public foundSmsText!: Observable<SmsText>;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('confirmAddSmsText')
  confirmAddSmsText!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private emailTextService: EmailTextService,
    private smsTextService: SmsTextService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<SmsTextDialogComponent>,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      sno: number;
    }
  ) {}
  private createFormGroup() {
    this.formGroup = this.fb.group<AddSmsTextForm>({
      flow: this.fb.control('', [Validators.required]),
      text: this.fb.control('', [Validators.required]),
      loctext: this.fb.control('', [Validators.required]),
      sub: this.fb.control('', [Validators.required]),
      subloc: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, []),
      userid: this.fb.control(this.getUserProfile().Usno, []),
    });
  }
  private switchFetchedSmsErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      ''
    );
    switch (errorMessage.toLocaleLowerCase()) {
      default:
        return this.tr.translate('setup.smsText.failedToFetchSmsText');
    }
  }
  private parseFetchedSmsTextResponse(
    result: HttpDataResponse<SmsText | number>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      let errorMessage = this.switchFetchedSmsErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      this.foundSmsText = of(result.response as SmsText);
      this.foundSmsText.subscribe({
        next: (result) => {
          this.flow.setValue(result.Flow_Id);
          this.text.setValue(result.SMS_Text);
          this.sub.setValue(result.SMS_Subject);
          this.subloc.setValue(result.SMS_Local);
          this.loctext.setValue(result.SMS_Other);
          this.sno.setValue(result.SNO);
        },
        error: (err) => {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate('defaults.warning'),
            this.tr.translate('setup.smsText.failedToFetchSmsText')
          );
          throw err;
        },
      });
    }
  }
  private buildPage() {
    this.startLoading = true;
    let flows = from(this.emailTextService.getFlows());
    let merged = zip(flows);
    merged.subscribe({
      next: (results) => {
        let [flows] = results;
        this.flows = flows.response as EmailTextFlow[];
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
  private fetchSmsText(smsId: number) {
    this.startLoading = true;
    let found = this.smsTextService.findSmsTextById(smsId);
    found.subscribe({
      next: (result) => {
        this.parseFetchedSmsTextResponse(result);
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
  private switchInsertSmsTextErrorMessage(message: string) {
    switch (message.toLocaleLowerCase()) {
      case 'Flow Id already exists'.toLocaleLowerCase():
        return this.tr.translate(`setup.smsSettings.flowIdExists`);
      default:
        return this.tr.translate('setup.smsText.failedToModifySmsText');
    }
  }
  private parseInsertSmsTextResponse(
    result: HttpDataResponse<number | SmsText>,
    message: string
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      let errorMessage = this.switchInsertSmsTextErrorMessage(
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
      this.addedSmsText.emit(result.response as SmsText);
    }
  }
  private requestInsertSmsText(form: AddSmsTextForm, message: string) {
    this.startLoading = true;
    let found = this.smsTextService.insertSmsText(form);
    found.subscribe({
      next: (result) => {
        this.parseInsertSmsTextResponse(result, message);
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
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  ngAfterViewInit(): void {
    if (this.data && this.data?.sno) {
      this.fetchSmsText(this.data?.sno);
    }
    this.buildPage();
  }
  closeDialog() {
    this.dialogRef.close();
  }
  addSmsText() {
    if (this.data && this.data?.sno) {
      let message = this.tr.translate(
        `setup.smsText.modifiedSmsTextSuccessfully`
      );
      this.requestInsertSmsText(this.formGroup.value, message);
    } else {
      let message = this.tr.translate(`setup.smsText.addedSmsTextSuccessully`);
      this.requestInsertSmsText(this.formGroup.value, message);
    }
  }
  submitSmsText() {
    if (this.formGroup.valid) {
      this.confirmAddSmsText.nativeElement.showModal();
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get flow() {
    return this.formGroup.get('flow') as FormControl;
  }
  get text() {
    return this.formGroup.get('text') as FormControl;
  }
  get loctext() {
    return this.formGroup.get('loctext') as FormControl;
  }
  get sub() {
    return this.formGroup.get('sub') as FormControl;
  }
  get subloc() {
    return this.formGroup.get('subloc') as FormControl;
  }
  get sno() {
    return this.formGroup.get('sno') as FormControl;
  }
}
