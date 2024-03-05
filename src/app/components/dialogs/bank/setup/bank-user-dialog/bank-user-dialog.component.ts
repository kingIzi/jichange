import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { BranchDialogComponent } from '../branch-dialog/branch-dialog.component';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { CommonModule } from '@angular/common';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-bank-user-dialog',
  templateUrl: './bank-user-dialog.component.html',
  styleUrls: ['./bank-user-dialog.component.scss'],
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
export class BankUserDialogComponent implements OnInit {
  public bankUserForm!: FormGroup;
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
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  submitBankUserForm() {
    if (this.bankUserForm.valid) {
      this.isLoading.emit(this.bankUserForm.value);
    }
    this.bankUserForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.bankUser.form.dialog') {
    if (this.employeeId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.employeeId`)
      );
    }
    if (this.firstName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.firstName`)
      );
    }
    if (this.lastName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.lastName`)
      );
    }
    if (this.middleName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.middleName`)
      );
    }
    if (this.username.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.username`)
      );
    }
    if (this.designation.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.designation`)
      );
    }
    if (this.branch.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.branch`)
      );
    }
    if (this.emailId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.emailId`)
      );
    }
    if (this.mobileNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.mobileNo`)
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
    this.bankUserForm = this.fb.group({
      employeeId: this.fb.control('', [Validators.required]),
      firstName: this.fb.control('', [Validators.required]),
      middleName: this.fb.control('', [Validators.required]),
      lastName: this.fb.control('', [Validators.required]),
      username: this.fb.control('', [Validators.required]),
      designation: this.fb.control('', [Validators.required]),
      branch: this.fb.control('', [Validators.required]),
      emailId: this.fb.control('', [Validators.required, Validators.email]),
      mobileNo: this.fb.control('', [
        Validators.required,
        Validators.pattern(/^[0-9]{12}/),
      ]),
      status: this.fb.control(false, [Validators.required]),
    });
  }
  get employeeId() {
    return this.bankUserForm.get('employeeId') as FormControl;
  }
  get firstName() {
    return this.bankUserForm.get('firstName') as FormControl;
  }
  get middleName() {
    return this.bankUserForm.get('middleName') as FormControl;
  }
  get lastName() {
    return this.bankUserForm.get('lastName') as FormControl;
  }
  get username() {
    return this.bankUserForm.get('username') as FormControl;
  }
  get designation() {
    return this.bankUserForm.get('designation') as FormControl;
  }
  get branch() {
    return this.bankUserForm.get('branch') as FormControl;
  }
  get emailId() {
    return this.bankUserForm.get('emailId') as FormControl;
  }
  get mobileNo() {
    return this.bankUserForm.get('mobileNo') as FormControl;
  }
  get status() {
    return this.bankUserForm.get('status') as FormControl;
  }
}
