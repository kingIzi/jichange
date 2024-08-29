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
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { SuspenseAccountService } from 'src/app/core/services/bank/setup/suspense-account/suspense-account.service';
import { Observable, TimeoutError, of, tap } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { SuspenseAccount } from 'src/app/core/models/bank/setup/suspense-account';
import { CompanyApprovalForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-approval-form';
import { ApprovalService } from 'src/app/core/services/bank/company/inbox-approval/approval.service';
import { SuccessMessageBoxComponent } from '../../../success-message-box/success-message-box.component';
import { SubmitMessageBoxComponent } from '../../../submit-message-box/submit-message-box.component';
import { SuspenseAccountDialogComponent } from '../../setup/suspense-account-dialog/suspense-account-dialog.component';
import {
  BankAccount,
  DepositAccount,
} from 'src/app/core/models/bank/setup/deposit-account';
import { DepositAccountService } from 'src/app/core/services/bank/setup/deposit-account/deposit-account.service';
import { DepositAccountDialogComponent } from '../../setup/deposit-account-dialog/deposit-account-dialog.component';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

interface ApprovedCompany {
  Comp_Dep_Acc_Sno: number;
  Deposit_Acc_No: string;
  Comp_Mas_Sno: number;
  AuditBy: string;
  Reason: string;
  Company: null;
  Audit_Date: null;
}

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
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
  public accountPool: FormControl = this.fb.control('', []);
  public selectAccountList: SuspenseAccount[] = [];
  public selectDepositAccountList: Company[] = [];
  public approved = new EventEmitter<number>();
  public company$: Observable<Company> = of();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('submitMessageBox') submitMessageBox!: SubmitMessageBoxComponent;
  @ViewChild('noSuspenseAccountFoundDilog', { static: true })
  noSuspenseAccountFoundDilog!: ElementRef<HTMLDialogElement>;
  @ViewChild('noDepositAccountFound', { static: true })
  noDepositAccountFound!: ElementRef<HTMLDialogElement>;
  @ViewChild('confirmApproveVendor')
  confirmApproveVendor!: ElementRef<HTMLDialogElement>;
  constructor(
    private router: Router,
    private appConfig: AppConfigService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private suspenseAccountService: SuspenseAccountService,
    private depositAccountService: DepositAccountService,
    private approvalService: ApprovalService,
    private companyService: CompanyService,
    private dialogRef: MatDialogRef<ApproveCompanyInboxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { company: Company }
  ) {}
  private accountPoolChangeEventListener() {
    this.accountPool.valueChanges.subscribe((value) => {
      if (value) {
        this.selectDepositAccountList = [];
        this.requestActiveSuspenseAccountsList();
        this.depositAccNo.setValue('');
      } else {
        this.selectAccountList = [];
        this.requestActiveDepositAccountsList();
        this.depositAccNo.setValue('');
      }
    });
  }
  private depositAccNoChangedEventListener() {
    this.depositAccNo.valueChanges.subscribe((value: string) => {
      if (this.accountPool.value === true) {
        let foundIndex = this.selectAccountList.findIndex(
          (account: SuspenseAccount) => account.Sus_Acc_No?.localeCompare(value)
        );
        this.suspenseAccSno.setValue(
          this.selectAccountList.at(foundIndex)?.Sus_Acc_Sno
        );
      } else {
        let foundIndex = this.selectDepositAccountList.findIndex((account) =>
          //account.Deposit_Acc_No.localeCompare(value)
          {
            return account.CompSno === Number(value);
          }
        );
        this.suspenseAccSno.setValue(
          this.selectDepositAccountList.at(foundIndex)?.BankSno
        );
      }
    });
  }
  private parseActiveSuspenseAccountsListResponse(
    result: HttpDataResponse<number | SuspenseAccount[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate('defaults.warning'),
        this.tr.translate(
          'company.inboxApproval.failedToRetrieveSuspenseAccount'
        )
      );
    } else if ((result.response as SuspenseAccount[]).length === 0) {
      this.selectAccountList = [];
      this.noSuspenseAccountFoundDilog.nativeElement.showModal();
    } else {
      this.selectAccountList = result.response as SuspenseAccount[];
    }
  }
  private requestActiveSuspenseAccountsList() {
    this.startLoading = true;
    this.suspenseAccountService
      .getSuspenseActiveAccountList({})
      .then((result) => {
        this.parseActiveSuspenseAccountsListResponse(result);
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
  private parseActiveDepositAccountsListResponse(
    result: HttpDataResponse<number | Company[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate('defaults.warning'),
        this.tr.translate(
          'company.inboxApproval.failedToRetrieveSuspenseAccount'
        )
      );
    } else if ((result.response as Company[]).length === 0) {
      this.selectDepositAccountList = [];
      this.noDepositAccountFound.nativeElement.showModal();
    } else {
      this.selectDepositAccountList = result.response as Company[];
    }
  }
  private requestActiveDepositAccountsList() {
    // this.startLoading = true;
    // this.depositAccountService
    //   .getDepositAccountList({})
    //   .then((result) => {
    //     // if (
    //     //   (typeof result.message === 'string' &&
    //     //     result.message.toLocaleLowerCase() ==
    //     //       'failed'.toLocaleLowerCase()) ||
    //     //   typeof result.response === 'number'
    //     // ) {
    //     //   this.noDepositAccountFound.nativeElement.showModal();
    //     // } else {
    //     //   this.selectDepositAccountList = result.response;
    //     // }
    //     this.parseActiveDepositAccountsListResponse(result);
    //     this.startLoading = false;
    //     this.cdr.detectChanges();
    //   })
    //   .catch((err) => {
    //     AppUtilities.requestFailedCatchError(
    //       err,
    //       this.displayMessageBox,
    //       this.tr
    //     );
    //     this.startLoading = false;
    //     this.cdr.detectChanges();
    //     throw err;
    //   });
    this.startLoading = true;
    this.depositAccountService
      .getBankAccountsByCompany({
        compid: this.formGroup.get('compsno')?.value,
      })
      .then((result) => {
        this.parseActiveDepositAccountsListResponse(result);
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
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
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
  private switchApproveCompanyErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      ''
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      default:
        return this.tr.translate(
          `company.inboxApproval.form.dialog.failedToApprove`
        );
    }
  }
  private parseApproveCompanyResponse(
    result: HttpDataResponse<number | Company>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchApproveCompanyErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let comp = result.response as any;
      this.approved.emit(comp.Comp_Mas_Sno);
    }
  }
  private requestApproveCompany(form: CompanyApprovalForm) {
    this.startLoading = true;
    this.approvalService
      .approveCompany(form)
      .then((result) => {
        this.parseApproveCompanyResponse(result);
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
  private parseCompanyByIdResponse(
    result: HttpDataResponse<string | number | Company>
  ) {
    let hasError = AppUtilities.hasErrorResult(result);
    if (hasError) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate('defaults.failed'),
        this.tr.translate('errors.notFound')
      );
    } else {
      this.company$ = of(result.response as Company);
    }
  }
  private requestCompanyById(compsno: number) {
    this.startLoading = true;
    this.companyService
      .getCompanyById({ Sno: compsno })
      .then((result) => {
        this.parseCompanyByIdResponse(result);
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
    if (this.data.company) {
      this.createFormGroup(this.data.company);
      let compsno = this.formGroup.get('compsno')?.value;
      this.requestCompanyById(Number(compsno));
    }
    this.accountPoolChangeEventListener();
    this.depositAccNoChangedEventListener();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  approveCompany() {
    this.requestApproveCompany(this.formGroup.value);
  }
  submitInboxApproval() {
    if (this.formGroup.valid) {
      this.confirmApproveVendor.nativeElement.showModal();
    } else {
      this.formGroup.markAllAsTouched();
    }
    //this.approved.emit();;lr4ofj[g53;t]
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
        this.requestActiveSuspenseAccountsList();
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
      this.requestActiveDepositAccountsList();
    });
  }
  closeDialog() {
    this.dialogRef.close();
  }
  getCompany() {
    if (this?.data?.company) {
      return this.data.company;
    }
    return null;
  }
  get suspenseAccSno() {
    return this.formGroup.get('suspenseAccSno') as FormControl;
  }
  get depositAccNo() {
    return this.formGroup.get('depositAccNo') as FormControl;
  }
}
