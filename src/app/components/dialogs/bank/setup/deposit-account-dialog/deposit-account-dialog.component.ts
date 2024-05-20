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
import { RegionDialogComponent } from '../region-dialog/region-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { SuspenseAccountService } from 'src/app/core/services/bank/setup/suspense-account/suspense-account.service';
import { CompanyService } from 'src/app/core/services/bank/company/summary/company.service';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { TimeoutError, catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { Company } from 'src/app/core/models/bank/company/company';
import { SuspenseAccount } from 'src/app/core/models/bank/setup/suspense-account';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { LoginResponse } from 'src/app/core/models/login-response';
import { DepositAccount } from 'src/app/core/models/bank/setup/deposit-account';
import { AddDepositAccount } from 'src/app/core/models/bank/forms/setup/deposit/add-deposit-account';
import { DepositAccountService } from 'src/app/core/services/bank/setup/deposit-account/deposit-account.service';

@Component({
  selector: 'app-deposit-account-dialog',
  templateUrl: './deposit-account-dialog.component.html',
  styleUrls: ['./deposit-account-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
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
export class DepositAccountDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public userProfile!: LoginResponse;
  public depositAccountForm!: FormGroup;
  public customers: Company[] = [];
  public accounts: SuspenseAccount[] = [];
  public added = new EventEmitter<any>();
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RegionDialogComponent>,
    private translocoService: TranslocoService,
    private suspenseAccountService: SuspenseAccountService,
    private companyService: CompanyService,
    private tr: TranslocoService,
    private depositAccountService: DepositAccountService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: { depositAccount: DepositAccount }
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private requestAddDepositAccount(body: AddDepositAccount) {
    this.startLoading = true;
    this.depositAccountService
      .addDepositAccount(body)
      .then((result) => {
        if (typeof result.response === 'number' && result.response > 0) {
          let dialog = AppUtilities.openSuccessMessageBox(
            this.successMessageBox,
            this.tr.translate(`setup.depositAccount.addedDepositSuccessfully`)
          );
          dialog.addEventListener('close', () => {
            this.added.emit();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.depositAccount.failedToUpdateDeposit`)
          );
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
  private formErrors(errorsPath: string = 'setup.depositAccount.form.dialog') {
    if (this.csno.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.vendor`)
      );
    }
    if (this.account.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.account`)
      );
    }
    if (this.reason.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.translocoService.translate(`${errorsPath}.invalidForm`),
        this.translocoService.translate(`${errorsPath}.reason`)
      );
    }
  }
  private createForm() {
    this.depositAccountForm = this.fb.group({
      csno: this.fb.control(0, [Validators.required]),
      account: this.fb.control('', [Validators.required]),
      reason: this.fb.control('', [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
    });
  }
  private buildPage() {
    this.startLoading = true;
    let customersListObservable = from(
      this.companyService.getCustomersList({})
    );
    let accountsListObservable = from(
      this.suspenseAccountService.getSuspenseActiveAccountList({})
    );
    let merged = zip(customersListObservable, accountsListObservable);
    let response = lastValueFrom(
      merged.pipe(
        map((result) => {
          return result;
        }),
        catchError((err) => {
          throw err;
        })
      )
    );
    response
      .then((res: Array<any>) => {
        let [customers, accounts] = res;
        this.startLoading = false;
        this.customers = customers.response === 0 ? [] : customers.response;
        this.accounts = accounts.response === 0 ? [] : accounts.response;
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
    this.buildPage();
    if (this.data.depositAccount) {
    } else {
      this.createForm();
    }
  }
  submitDepositForm() {
    if (this.depositAccountForm.valid) {
      this.requestAddDepositAccount(this.depositAccountForm.value);
    }
    this.depositAccountForm.markAllAsTouched();
    this.formErrors();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setControlValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  get csno() {
    return this.depositAccountForm.get('csno') as FormControl;
  }
  get account() {
    return this.depositAccountForm.get('account') as FormControl;
  }
  get reason() {
    return this.depositAccountForm.get('reason') as FormControl;
  }
}
