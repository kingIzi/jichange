import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { Company } from 'src/app/core/models/bank/company/company';
import { LoginResponse } from 'src/app/core/models/login-response';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { SuspenseAccountService } from 'src/app/core/services/bank/setup/suspense-account/suspense-account.service';
import { TimeoutError, tap } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { SuspenseAccount } from 'src/app/core/models/bank/setup/suspense-account';
import { CompanyApprovalForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-approval-form';
import { ApprovalService } from 'src/app/core/services/bank/company/inbox-approval/approval.service';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { SubmitMessageBoxComponent } from '../../../submit-message-box/submit-message-box.component';
import { SuspenseAccountDialogComponent } from '../../setup/suspense-account-dialog/suspense-account-dialog.component';
import { DepositAccount } from 'src/app/core/models/bank/setup/deposit-account';
import { DepositAccountService } from 'src/app/core/services/bank/setup/deposit-account/deposit-account.service';
import { DepositAccountDialogComponent } from '../../setup/deposit-account-dialog/deposit-account-dialog.component';

@Component({
  selector: 'app-approve-company-inbox',
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    FormsModule,
    LoaderInfiniteSpinnerComponent,
    SuccessMessageBoxComponent,
    SubmitMessageBoxComponent,
    MatDialogModule,
  ],
  templateUrl: './approve-company-inbox.component.html',
  styleUrl: './approve-company-inbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/company', alias: 'company' },
    },
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ApproveCompanyInboxComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  private userProfile!: LoginResponse;
  public accountPool: FormControl = this.fb.control('', []);
  public selectAccountList: SuspenseAccount[] = [];
  public selectDepositAccountList: DepositAccount[] = [];
  public approved = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('submitMessageBox') submitMessageBox!: SubmitMessageBoxComponent;
  @ViewChild('noSuspenseAccountFoundDilog', { static: true })
  noSuspenseAccountFoundDilog!: ElementRef<HTMLDialogElement>;
  @ViewChild('noDepositAccountFound', { static: true })
  noDepositAccountFound!: ElementRef<HTMLDialogElement>;
  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private suspenseAccountService: SuspenseAccountService,
    private depositAccountService: DepositAccountService,
    private approvalService: ApprovalService,
    private dialogRef: MatDialogRef<ApproveCompanyInboxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { company: Company }
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private accountPoolChangeEventListener() {
    this.accountPool.valueChanges.subscribe((value) => {
      if (
        value.toLocaleLowerCase() === 'Suspense Account'.toLocaleLowerCase()
      ) {
        this.requestAccountPool();
        this.selectDepositAccountList =
          this.selectDepositAccountList.length > 0
            ? []
            : this.selectDepositAccountList;
        this.depositAccNo.setValue('');
      } else if (
        value.toLocaleLowerCase() === 'Deposit Account'.toLocaleLowerCase()
      ) {
        this.requestDepositAccountPool();
        this.selectAccountList =
          this.selectAccountList.length > 0 ? [] : this.selectAccountList;
        this.depositAccNo.setValue('');
      } else {
      }
    });
  }
  private depositAccNoChangedEventListener() {
    this.depositAccNo.valueChanges.subscribe((value) => {
      if (
        this.accountPool.value.toLocaleLowerCase() ===
          'Suspense Account'.toLocaleLowerCase() &&
        this.selectAccountList.length > 0
      ) {
        let foundIndex = this.selectAccountList.findIndex(
          (account: SuspenseAccount) => account.Sus_Acc_No === value
        );
        if (foundIndex > -1) {
          this.suspenseAccSno.setValue(
            this.selectAccountList.at(foundIndex)?.Sus_Acc_Sno
          );
        }
      } else {
        let foundIndex = this.selectDepositAccountList.findIndex(
          (account) => account.Deposit_Acc_No == value
        );
        if (foundIndex > -1) {
          this.suspenseAccSno.setValue(
            this.selectDepositAccountList.at(foundIndex)?.Comp_Dep_Acc_Sno
          );
        }
      }
    });
  }
  private requestAccountPool() {
    this.startLoading = true;
    this.suspenseAccountService
      .getSuspenseActiveAccountList({})
      .then((result) => {
        if (
          result.message.toLocaleLowerCase() == 'failed'.toLocaleLowerCase()
        ) {
          this.noSuspenseAccountFoundDilog.nativeElement.showModal();
        } else if (
          result.message.toLocaleLowerCase() === 'success' &&
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.selectAccountList = result.response;
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
  private requestDepositAccountPool() {
    this.startLoading = true;
    this.depositAccountService
      .getDepositAccountList({})
      .then((result) => {
        if (
          result.message.toLocaleLowerCase() == 'failed'.toLocaleLowerCase() ||
          typeof result.response === 'number'
        ) {
          this.noDepositAccountFound.nativeElement.showModal();
        } else {
          this.selectDepositAccountList = result.response;
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
  private createFormGroup(company: Company) {
    this.formGroup = this.fb.group({
      compsno: this.fb.control(company.CompSno, [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      suspenseAccSno: this.fb.control('', [Validators.required]),
      depositAccNo: this.fb.control('', [Validators.required]),
    });
  }
  private formErrors(errorsPath: string = 'company.inboxApproval.form.dialog') {
    if (this.depositAccNo.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.account`)
      );
    }
    if (this.suspenseAccSno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.accountNumberNotFound`)
      );
    }
  }
  private requestApproveCompany(form: CompanyApprovalForm) {
    this.startLoading = true;
    this.approvalService
      .approveCompany(form)
      .then((result) => {
        if (typeof result.response === 'number') {
          let m = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`company.inboxApproval.approvedSuccessfully`)
          );
          this.approved.emit();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(
              `company.inboxApproval.form.dialog.failedToApprove`
            )
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
  ngOnInit(): void {
    this.parseUserProfile();
    if (this.data.company) {
      this.createFormGroup(this.data.company);
    }
    this.accountPoolChangeEventListener();
    this.depositAccNoChangedEventListener();
  }
  submitInboxApproval() {
    if (this.formGroup.valid) {
      this.requestApproveCompany(this.formGroup.value);
    } else {
      this.formGroup.markAllAsTouched();
      this.formErrors();
    }
  }
  addSuspenseAccount() {
    let dialogRef = this.dialog.open(SuspenseAccountDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        suspenseAccount: null,
      },
    });
    dialogRef.componentInstance.addedSuspenseAccount
      .asObservable()
      .subscribe(() => {
        dialogRef.close();
        this.requestAccountPool();
      });
  }
  addDepositAccount() {
    let dialogRef = this.dialog.open(DepositAccountDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {
        depositAccount: null,
      },
    });
    dialogRef.componentInstance.added.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestDepositAccountPool();
    });
  }
  closeDialog() {
    this.dialogRef.close();
  }
  get suspenseAccSno() {
    return this.formGroup.get('suspenseAccSno') as FormControl;
  }
  get depositAccNo() {
    return this.formGroup.get('depositAccNo') as FormControl;
  }
}
