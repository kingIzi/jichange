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
import { CountryDialogComponent } from '../country-dialog/country-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { SuspenseAccount } from 'src/app/core/models/bank/setup/suspense-account';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { SuspenseAccountService } from 'src/app/core/services/bank/setup/suspense-account/suspense-account.service';
import { TimeoutError } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AddSuspenseAccountForm } from 'src/app/core/models/bank/forms/setup/suspense-account/add-suspense-account-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

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
    LoaderInfiniteSpinnerComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
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
  public addedSuspenseAccount = new EventEmitter<SuspenseAccount>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddSuspenseAccount')
  confirmAddSuspenseAccount!: ElementRef<HTMLDialogElement>;
  constructor(
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    private tr: TranslocoService,
    private suspenseAccountService: SuspenseAccountService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { suspenseAccount: SuspenseAccount },
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createForm() {
    this.suspenseAccountForm = this.fb.group({
      account: this.fb.control('', [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      status: this.fb.control('', [Validators.required]),
    });
  }
  private createEditForm(suspenseAccount: SuspenseAccount) {
    this.suspenseAccountForm = this.fb.group({
      account: this.fb.control(suspenseAccount.Sus_Acc_No, [
        Validators.required,
      ]),
      sno: this.fb.control(suspenseAccount.Sus_Acc_Sno, [Validators.required]),
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      status: this.fb.control(suspenseAccount.Status, [Validators.required]),
      dummy: this.fb.control(true, []),
    });
  }
  private switchAddSuspenseAccountErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      this.account.value
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Missing account'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.suspenseAccount.form.dialog.suspenseAccount`
        );
      case 'Missing status'.toLocaleLowerCase():
        return this.tr.translate(
          `setup.suspenseAccount.form.dialog.missingStatus`
        );
      default:
        return this.tr.translate(
          `setup.suspenseAccount.form.dialog.failedToAddSuspenseAccount`
        );
    }
  }

  private parseAddSuspenseAccountResponse(
    result: HttpDataResponse<number | SuspenseAccount>,
    successMessage: string
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchAddSuspenseAccountErrorMessage(
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
      this.addedSuspenseAccount.emit(result.response as SuspenseAccount);
    }
  }
  private requestAddSuspenseAccount(
    form: AddSuspenseAccountForm,
    successMessage: string
  ) {
    this.startLoading = true;
    this.suspenseAccountService
      .addSuspenseAccount(form)
      .then((result) => {
        this.parseAddSuspenseAccountResponse(result, successMessage);
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
    if (this.data?.suspenseAccount) {
      this.createEditForm(this.data.suspenseAccount);
    } else {
      this.createForm();
    }
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  submitSuspenseAccountForm() {
    if (this.suspenseAccountForm.valid) {
      this.confirmAddSuspenseAccount.nativeElement.showModal();
    } else {
      this.suspenseAccountForm.markAllAsTouched();
    }
  }
  addSuspenseAccount() {
    if (this.data?.suspenseAccount) {
      let message = this.tr.translate(
        `setup.suspenseAccount.addedSuspenseAccountSuccessfully`
      );
      this.requestAddSuspenseAccount(this.suspenseAccountForm.value, message);
    } else {
      let message = this.tr.translate(
        `setup.suspenseAccount.addedSuspenseAccountSuccessfully`
      );
      this.requestAddSuspenseAccount(this.suspenseAccountForm.value, message);
    }
  }
  get account() {
    return this.suspenseAccountForm.get('account') as FormControl;
  }
  get status() {
    return this.suspenseAccountForm.get('status') as FormControl;
  }
}
