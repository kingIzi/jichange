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
  selector: 'app-smtp-dialog',
  templateUrl: './smtp-dialog.component.html',
  styleUrls: ['./smtp-dialog.component.scss'],
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
export class SmtpDialogComponent implements OnInit {
  public smtpForm!: FormGroup;
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
  submitSmtpForm() {
    if (this.smtpForm.valid) {
      this.isLoading.emit(this.smtpForm.value);
    }
    this.smtpForm.markAllAsTouched();
    this.formErrors();
  }
  private formErrors(errorsPath: string = 'setup.smtp.form.dialog') {
    if (this.fromAddress.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.fromAddress`)
      );
    }
    if (this.address.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.address`)
      );
    }
    if (this.portNumber.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.portNumber`)
      );
    }
    if (this.username.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.username`)
      );
    }
    if (this.password.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.password`)
      );
    }
    if (this.sslMode.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.sslEnable`)
      );
    }
  }
  private createForm() {
    this.smtpForm = this.fb.group({
      fromAddress: this.fb.control('', [Validators.required, Validators.email]),
      address: this.fb.control('', [Validators.required]),
      portNumber: this.fb.control('', [Validators.required]),
      username: this.fb.control('', [Validators.required]),
      password: this.fb.control('', [Validators.required]),
      sslMode: this.fb.control(false, [Validators.required]),
    });
  }
  get fromAddress() {
    return this.smtpForm.get('fromAddress') as FormControl;
  }
  get address() {
    return this.smtpForm.get('address') as FormControl;
  }
  get portNumber() {
    return this.smtpForm.get('portNumber') as FormControl;
  }
  get username() {
    return this.smtpForm.get('username') as FormControl;
  }
  get password() {
    return this.smtpForm.get('password') as FormControl;
  }
  get sslMode() {
    return this.smtpForm.get('sslMode') as FormControl;
  }
}
