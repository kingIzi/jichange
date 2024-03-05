import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from '../../success-message-box/success-message-box.component';
import { MatDialogRef } from '@angular/material/dialog';
import { CountryDialogComponent } from '../../bank/setup/country-dialog/country-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';

@Component({
  selector: 'app-company-users-dialog',
  templateUrl: './company-users-dialog.component.html',
  styleUrls: ['./company-users-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
  ],
})
export class CompanyUsersDialogComponent implements OnInit {
  public companyUsersForm!: FormGroup;
  public isLoading = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
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
  updatePhoneNumberPrefix(prefix: string) {
    prefix = prefix.substring(1);
    if (this.mobileNo.value.startsWith('0')) {
      let value = this.mobileNo.value.substring(1);
      this.mobileNo.setValue(prefix + value);
    } else if (
      !this.mobileNo.value.startsWith('0') &&
      !this.mobileNo.value.startsWith('255') &&
      this.mobileNo.value.length === 9
    ) {
      this.mobileNo.setValue(prefix + this.mobileNo.value);
    }
  }
  submitCompanyUsersForm() {
    if (this.companyUsersForm.valid) {
      console.log(this.companyUsersForm.value);
      //this.isLoading.emit(this.customerForm.value);
    }
    this.companyUsersForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'vendors.companyUsers.form.dialog') {
    if (this.role.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.role`)
      );
    }
    if (this.mobileNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.mobileNo`)
      );
    }
    if (this.emailId.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.emailId`)
      );
    }
    if (this.userPosition.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.userPosition`)
      );
    }
    if (this.fullName.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.fullName`)
      );
    }
    if (this.username.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.username`)
      );
    }
  }
  private createForm() {
    this.companyUsersForm = this.fb.group({
      role: this.fb.control('', [Validators.required]),
      username: this.fb.control('', [Validators.required]),
      fullName: this.fb.control('', [Validators.required]),
      mobileNo: this.fb.control('', [Validators.required]),
      userPosition: this.fb.control('', [Validators.required]),
      emailId: this.fb.control('', [Validators.required, Validators.email]),
    });
  }
  get role() {
    return this.companyUsersForm.get('role') as FormControl;
  }
  get username() {
    return this.companyUsersForm.get('username') as FormControl;
  }
  get fullName() {
    return this.companyUsersForm.get('fullName') as FormControl;
  }
  get mobileNo() {
    return this.companyUsersForm.get('mobileNo') as FormControl;
  }
  get emailId() {
    return this.companyUsersForm.get('emailId') as FormControl;
  }
  get userPosition() {
    return this.companyUsersForm.get('userPosition') as FormControl;
  }
}
