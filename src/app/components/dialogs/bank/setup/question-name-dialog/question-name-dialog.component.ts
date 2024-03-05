import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
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
import { MatDialogRef } from '@angular/material/dialog';
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class QuestionNameDialogComponent implements OnInit {
  public questionNameForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private translocoService: TranslocoService
  ) {}
  ngOnInit(): void {
    this.createForm();
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitQuestionNameForm() {
    if (this.questionNameForm.valid) {
      this.isLoading.emit(this.questionNameForm.value);
    }
    this.questionNameForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.questionName.form.dialog') {
    if (this.questionName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingQuestionName`)
      );
    }
    if (this.status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.questionNameForm = this.fb.group({
      questionName: this.fb.control('', [Validators.required]),
      status: this.fb.control(false, [Validators.required]),
    });
  }
  get questionName() {
    return this.questionNameForm.get('questionName') as FormControl;
  }
  get status() {
    return this.questionNameForm.get('status') as FormControl;
  }
}
