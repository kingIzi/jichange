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
import { CountryDialogComponent } from '../country-dialog/country-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { SuspenseAccount } from 'src/app/core/models/bank/suspense-account';
import { LoginResponse } from 'src/app/core/models/login-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { SuspenseAccountService } from 'src/app/core/services/bank/setup/suspense-account.service';
import { TimeoutError } from 'rxjs';

@Component({
  selector: 'app-suspense-account-dialog',
  templateUrl: './suspense-account-dialog.component.html',
  styleUrls: ['./suspense-account-dialog.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    TranslocoModule,
    LoaderRainbowComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class SuspenseAccountDialogComponent implements OnInit {
  public suspenseAccountForm!: FormGroup;
  public startLoading: boolean = false;
  private userProfile!: LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private tr: TranslocoService,
    private suspenseAccountService: SuspenseAccountService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { suspenseAccount: SuspenseAccount },
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private formErrors(errorsPath: string = 'setup.suspenseAccount.form.dialog') {
    if (this.account.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.suspenseAccount`)
      );
    }
    if (this.status.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingStatus`)
      );
    }
  }
  private createForm() {
    this.suspenseAccountForm = this.fb.group({
      account: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      status: this.fb.control('', [Validators.required]),
    });
  }
  private createEditForm(suspenseAccount: SuspenseAccount) {
    this.suspenseAccountForm = this.fb.group({
      account: this.fb.control(suspenseAccount.Sus_Acc_No, [
        Validators.required,
      ]),
      sno: this.fb.control(suspenseAccount.Sus_Acc_Sno, [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      status: this.fb.control(suspenseAccount.Status, [Validators.required]),
    });
  }
  private requestPostSuspenseAccount(form: any) {
    this.startLoading = true;
    this.suspenseAccountService
      .addSuspenseAccount(form)
      .then((res: any) => {
        if (typeof res.response === 'string' && res.response === 'Exist') {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`setup.suspenseAccount.form.dialog.failed`),
            this.tr.translate(
              `setup.suspenseAccount.form.dialog.failedToAddSuspenseAccount`
            )
          );
        } else if (typeof res.response === 'string' && res.response === '0') {
          let dialog = AppUtilities.openSuccessMessageBox(
            this.successMessageBox,
            this.tr.translate(
              `setup.suspenseAccount.addedSuspenseAccountSuccessfully`
            )
          );
          dialog.addEventListener('close', () => {
            this.closeDialog();
          });
        }
        this.startLoading = false;
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
    this.parseUserProfile();
    if (this.data.suspenseAccount) {
      this.createEditForm(this.data.suspenseAccount);
    } else {
      this.createForm();
    }
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitSuspenseAccountForm() {
    if (this.suspenseAccountForm.valid) {
      this.requestPostSuspenseAccount(this.suspenseAccountForm.value);
    }
    this.suspenseAccountForm.markAllAsTouched();
    this.formErrors();
  }
  get account() {
    return this.suspenseAccountForm.get('account') as FormControl;
  }
  get status() {
    return this.suspenseAccountForm.get('status') as FormControl;
  }
}
