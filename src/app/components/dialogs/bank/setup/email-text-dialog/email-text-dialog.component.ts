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
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class EmailTextDialogComponent implements OnInit {
  public emailTextForm!: FormGroup;
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
  submitEmailTextForm() {
    if (this.emailTextForm.valid) {
      this.isLoading.emit(this.emailTextForm.value);
    }
    this.emailTextForm.markAllAsTouched();
    this.formErrors();
  }
  private createForm() {
    this.emailTextForm = this.fb.group({
      flowId: this.fb.control('', [Validators.required]),
      subjectEnglish: this.fb.control('', [Validators.required]),
      subjectSwahili: this.fb.control('', [Validators.required]),
      emailText: this.fb.control('', [Validators.required]),
      emailSwahili: this.fb.control('', [Validators.required]),
    });
  }
  private formErrors(errorsPath: string = 'setup.emailText.form.dialog') {
    if (this.flowId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.flowId`)
      );
    }
    if (this.subjectEnglish.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.subjectEnglish`)
      );
    }
    if (this.subjectSwahili.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.subjectSwahili`)
      );
    }
    if (this.emailText.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.emailText`)
      );
    }
    if (this.emailSwahili.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.emailSwahili`)
      );
    }
  }
  get flowId() {
    return this.emailTextForm.get('flowId') as FormControl;
  }
  get subjectEnglish() {
    return this.emailTextForm.get('subjectEnglish') as FormControl;
  }
  get subjectSwahili() {
    return this.emailTextForm.get('subjectSwahili') as FormControl;
  }
  get emailText() {
    return this.emailTextForm.get('emailText') as FormControl;
  }
  get emailSwahili() {
    return this.emailTextForm.get('emailSwahili') as FormControl;
  }
}
