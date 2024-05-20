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
import { SMTP } from 'src/app/core/models/bank/setup/smtp';
import { LoginResponse } from 'src/app/core/models/login-response';
import { AddSmtpForm } from 'src/app/core/models/bank/forms/setup/smtp/add-smtp';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { SmtpService } from 'src/app/core/services/bank/setup/smtp/smtp.service';

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
export class SmtpDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public smtpForm!: FormGroup;
  public userProfile!: LoginResponse;
  public addedSmtp = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BranchDialogComponent>,
    private smtpService: SmtpService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      smtp: SMTP;
    }
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private formErrors(errorsPath: string = 'setup.smtp.form.dialog') {
    if (this.from_address.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.fromAddress`)
      );
    }
    if (this.smtp_address.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.address`)
      );
    }
    if (this.smtp_port.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.portNumber`)
      );
    }
    if (this.smtp_uname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.username`)
      );
    }
    if (this.smtp_pwd.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.password`)
      );
    }
    if (this.gender.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.sslEnable`)
      );
    }
  }
  private requestInsertSmtp(body: AddSmtpForm, successMessage: string) {
    this.startLoading = true;
    this.smtpService
      .insertSmtp(body)
      .then((result) => {
        if (result.response && typeof result.response !== 'boolean') {
          let sal = AppUtilities.sweetAlertSuccessMessage(successMessage);
          sal.then((res) => {
            this.addedSmtp.emit();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.smtp.failedToAddSmtp`)
          );
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
  private createForm() {
    this.smtpForm = this.fb.group({
      from_address: this.fb.control('', [
        Validators.required,
        Validators.email,
      ]),
      smtp_address: this.fb.control('', [Validators.required]),
      smtp_port: this.fb.control('', [Validators.required]),
      smtp_uname: this.fb.control('', [Validators.required]),
      smtp_pwd: this.fb.control('', [Validators.required]),
      gender: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, []),
      userid: this.fb.control(this.userProfile.Usno, []),
    });
  }
  private createEditForm(smtp: SMTP) {
    this.smtpForm = this.fb.group({
      from_address: this.fb.control(smtp.From_Address, [
        Validators.required,
        Validators.email,
      ]),
      smtp_address: this.fb.control(smtp.SMTP_Address, [Validators.required]),
      smtp_port: this.fb.control(smtp.SMTP_Port, [Validators.required]),
      smtp_uname: this.fb.control(smtp.SMTP_UName, [Validators.required]),
      smtp_pwd: this.fb.control(smtp.SMTP_Password ?? '', []),
      gender: this.fb.control(smtp.SSL_Enable, [Validators.required]),
      sno: this.fb.control(smtp.SNO, []),
      userid: this.fb.control(this.userProfile.Usno, []),
    });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    if (this.data.smtp) {
      this.createEditForm(this.data.smtp);
    } else {
      this.createForm();
    }
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitSmtpForm() {
    if (this.smtpForm.valid && this.data.smtp) {
      //this.addedSmtp.emit(this.smtpForm.value);
      this.requestInsertSmtp(
        this.smtpForm.value,
        this.tr.translate(`setup.smtp.modifiedSmtp`)
      );
    } else if (this.smtpForm.valid && !this.data.smtp) {
      this.requestInsertSmtp(
        this.smtpForm.value,
        this.tr.translate(`setup.smtp.addedSmtp`)
      );
    } else {
      this.smtpForm.markAllAsTouched();
    }
  }
  get from_address() {
    return this.smtpForm.get('from_address') as FormControl;
  }
  get smtp_address() {
    return this.smtpForm.get('smtp_address') as FormControl;
  }
  get smtp_port() {
    return this.smtpForm.get('smtp_port') as FormControl;
  }
  get smtp_uname() {
    return this.smtpForm.get('smtp_uname') as FormControl;
  }
  get smtp_pwd() {
    return this.smtpForm.get('smtp_pwd') as FormControl;
  }
  get gender() {
    return this.smtpForm.get('gender') as FormControl;
  }
}
