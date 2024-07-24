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
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { QuestionName } from 'src/app/core/models/bank/setup/question-name';
import { QuestionNameService } from 'src/app/core/services/bank/setup/question-name/question-name.service';
import { AddQuestionName } from 'src/app/core/models/bank/forms/setup/question-name/add-question-name';
import { TimeoutError } from 'rxjs';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-question-name-dialog',
  templateUrl: './question-name-dialog.component.html',
  styleUrls: ['./question-name-dialog.component.scss'],
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
export class QuestionNameDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public questionNameForm!: FormGroup;
  public added = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private appConfig: AppConfigService,
    private questionNameService: QuestionNameService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      questionName: QuestionName;
    }
  ) {}
  private formErrors(errorsPath: string = 'setup.questionName.form.dialog') {
    if (this.q_name.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingQuestionName`)
      );
    }
    if (this.q_qstatus.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.questionNameForm = this.fb.group({
      q_name: this.fb.control('', [Validators.required]),
      q_qstatus: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      dummy: this.fb.control(true, []),
    });
  }
  private createEditForm(questionName: QuestionName) {
    this.questionNameForm = this.fb.group({
      q_name: this.fb.control(questionName.Q_Name, [Validators.required]),
      q_qstatus: this.fb.control(questionName.Q_Status, [Validators.required]),
      sno: this.fb.control(questionName.SNO, [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      dummy: this.fb.control(true, []),
    });
  }
  private requestPostQuestioName(form: AddQuestionName) {
    this.startLoading = true;
    this.questionNameService
      .addQuestionName(form)
      .then((result) => {
        this.startLoading = false;
        if (typeof result.response === 'number' && result.response > 0) {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.questionName.addedQuestionSuccessfully`)
          );
          this.added.emit();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(
              `setup.questionName.form.dialog.failedToAddQuestion`
            )
          );
        }
        this.cdr.detectChanges();
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  ngOnInit(): void {
    if (this.data.questionName) {
      this.createEditForm(this.data.questionName);
    } else {
      this.createForm();
    }
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitQuestionNameForm() {
    if (this.questionNameForm.valid) {
      this.requestPostQuestioName(this.questionNameForm.value);
    }
    this.questionNameForm.markAllAsTouched();
    this.formErrors();
  }
  get q_name() {
    return this.questionNameForm.get('q_name') as FormControl;
  }
  get q_qstatus() {
    return this.questionNameForm.get('q_qstatus') as FormControl;
  }
}
