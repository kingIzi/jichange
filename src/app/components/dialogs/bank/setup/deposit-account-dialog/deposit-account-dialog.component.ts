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
import { RegionDialogComponent } from '../region-dialog/region-dialog.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { SuspenseAccountService } from 'src/app/core/services/bank/setup/suspense-account.service';
import { CompanyService } from 'src/app/core/services/bank/company/company.service';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { TimeoutError, catchError, from, lastValueFrom, map, zip } from 'rxjs';
import { Company } from 'src/app/core/models/bank/company';
import { SuspenseAccount } from 'src/app/core/models/bank/suspense-account';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

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
    LoaderRainbowComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/setup', alias: 'setup' },
    },
  ],
})
export class DepositAccountDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public depositAccountForm!: FormGroup;
  public customers: Company[] = [];
  public accounts: SuspenseAccount[] = [];
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
    private tr: TranslocoService
  ) {}
  private formErrors(errorsPath: string = 'setup.depositAccount.form.dialog') {
    if (this.vendor.invalid) {
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
      vendor: this.fb.control('', [Validators.required]),
      account: this.fb.control('', [Validators.required]),
      reason: this.fb.control('', [Validators.required]),
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
      })
      .catch((err) => {
        if (err instanceof TimeoutError) {
          AppUtilities.openTimeoutError(this.displayMessageBox, this.tr);
        } else {
          AppUtilities.noInternetError(this.displayMessageBox, this.tr);
        }
        this.startLoading = false;
        throw err;
      });
  }
  ngOnInit(): void {
    this.createForm();
    this.buildPage();
  }
  submitDepositForm() {
    if (this.depositAccountForm.valid) {
      //this.isLoading.emit(this.depositAccountForm.value);
      console.log(this.depositAccountForm.value);
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
  get vendor() {
    return this.depositAccountForm.get('vendor') as FormControl;
  }
  get account() {
    return this.depositAccountForm.get('account') as FormControl;
  }
  get reason() {
    return this.depositAccountForm.get('reason') as FormControl;
  }
}
