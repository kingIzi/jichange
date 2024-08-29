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
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  EmailText,
  EmailTextFlow,
} from 'src/app/core/models/bank/setup/email-text';
import { AddEmailTextForm } from 'src/app/core/models/bank/forms/setup/email-text/add-email-text-form';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { EmailTextService } from 'src/app/core/services/bank/setup/email-text/email-text.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { from, zip } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-email-text-dialog',
  templateUrl: './email-text-dialog.component.html',
  styleUrls: ['./email-text-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
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
export class EmailTextDialogComponent implements OnInit {
  // public flows: string[] = [
  //   'On Registration',
  //   'On Invoice Generation',
  //   'On Receipt',
  //   'On Invoice Cancellation',
  //   'On Invoice Ammendent',
  //   'On OTP',
  //   'On User Registration',
  // ];
  public flows: EmailTextFlow[] = [];
  public emailTextForm!: FormGroup;
  public startLoading: boolean = false;
  public addedEmailText = new EventEmitter<EmailText>();
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddEmailText')
  confirmAddEmailText!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private tr: TranslocoService,
    private emailTextService: EmailTextService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      emailText: EmailText;
    }
  ) {}
  private createForm() {
    this.emailTextForm = this.fb.group({
      flow: this.fb.control('', [Validators.required]),
      text: this.fb.control('', [Validators.required]),
      loctext: this.fb.control('', [Validators.required]),
      sub: this.fb.control('', [Validators.required]),
      subloc: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, []),
      userid: this.fb.control(this.getUserProfile().Usno, []),
    });
  }
  private createEditForm(email: EmailText) {
    this.emailTextForm = this.fb.group({
      flow: this.fb.control(Number(email.Flow_Id), [Validators.required]),
      text: this.fb.control(email.Email_Text, [Validators.required]),
      loctext: this.fb.control(email.Local_Text, [Validators.required]),
      sub: this.fb.control(email.Subject, [Validators.required]),
      subloc: this.fb.control(email.Local_subject, [Validators.required]),
      sno: this.fb.control(email.SNO, []),
      userid: this.fb.control(this.getUserProfile().Usno, []),
    });
  }
  private formErrors(errorsPath: string = 'setup.emailText.form.dialog') {
    if (this.flow.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.flowId`)
      );
    }
    if (this.text.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.subjectEnglish`)
      );
    }
    if (this.loctext.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.subjectSwahili`)
      );
    }
    if (this.sub.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.emailText`)
      );
    }
    if (this.subloc.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.emailSwahili`)
      );
    }
  }
  private switchInsertEmailTextErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Email'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing flow'.toLocaleLowerCase():
        return this.tr.translate(`setup.emailText.form.dialog.flowId`);
      case 'Missing text'.toLocaleLowerCase():
        return this.tr.translate(`setup.emailText.form.dialog.emailText`);
      case 'Missing text in swahili'.toLocaleLowerCase():
        return this.tr.translate(`setup.emailText.form.dialog.emailSwahili`);
      case 'Missing subject'.toLocaleLowerCase():
        return this.tr.translate(`setup.emailText.form.dialog.subjectEnglish`);
      case 'Missing subject in swahili'.toLocaleLowerCase():
        return this.tr.translate(`setup.emailText.form.dialog.subjectSwahili`);
      case 'Flow already exists'.toLocaleLowerCase():
        return this.tr.translate('setup.emailText.flowIdExists');
      default:
        return this.tr.translate(`setup.emailText.failedToAddEmailText`);
    }
  }
  private parseInsertEmailTextResponse(
    result: HttpDataResponse<number | EmailText>,
    successMessage: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchInsertEmailTextErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      //let sal = AppUtilities.sweetAlertSuccessMessage(successMessage);
      AppUtilities.showSuccessMessage(
        successMessage,
        (e: MouseEvent) => {},
        this.tr.translate('actions.ok')
      );
      this.addedEmailText.emit(result.response as EmailText);
    }
  }
  private requestInsertEmailText(
    body: AddEmailTextForm,
    successMessage: string
  ) {
    this.startLoading = true;
    this.emailTextService
      .insertEmailText(body)
      .then((result) => {
        this.parseInsertEmailTextResponse(result, successMessage);
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
    let flows = from(this.emailTextService.getFlows());
    let mergedObservable = zip(flows);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [flows] = results;
        this.flows = flows.response as EmailTextFlow[];
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
    if (this.data.emailText) {
      this.createEditForm(this.data.emailText);
    } else {
      this.createForm();
    }
    this.buildPage();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitEmailTextForm() {
    if (this.emailTextForm.valid) {
      this.confirmAddEmailText.nativeElement.showModal();
    } else {
      this.emailTextForm.markAllAsTouched();
    }
  }
  addEmailText() {
    if (this.data?.emailText) {
      let message = this.tr.translate(`setup.emailText.modifiedEmailText`);
      this.requestInsertEmailText(this.emailTextForm.value, message);
    } else {
      let message = this.tr.translate(`setup.emailText.addedEmailText`);
      this.requestInsertEmailText(this.emailTextForm.value, message);
    }
  }
  get flow() {
    return this.emailTextForm.get('flow') as FormControl;
  }
  get text() {
    return this.emailTextForm.get('text') as FormControl;
  }
  get loctext() {
    return this.emailTextForm.get('loctext') as FormControl;
  }
  get sub() {
    return this.emailTextForm.get('sub') as FormControl;
  }
  get subloc() {
    return this.emailTextForm.get('subloc') as FormControl;
  }
}
