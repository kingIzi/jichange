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
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { Currency } from 'src/app/core/models/bank/setup/currency';
import { LoginResponse } from 'src/app/core/models/login-response';
import { CurrencyService } from 'src/app/core/services/bank/setup/currency/currency.service';
import { AddCurrency } from 'src/app/core/models/bank/forms/setup/currency/add-currency';
import { TimeoutError } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';

@Component({
  selector: 'app-currency-dialog',
  templateUrl: './currency-dialog.component.html',
  styleUrls: ['./currency-dialog.component.scss'],
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
export class CurrencyDialogComponent implements OnInit {
  public startLoading: boolean = false;
  public currencyForm!: FormGroup;
  public added = new EventEmitter<any>();
  private userProfile!: LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('confirmAddCurrency', { static: true })
  confirmAddCurrency!: ElementRef<HTMLDialogElement>;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CurrencyDialogComponent>,
    private tr: TranslocoService,
    private currencyService: CurrencyService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      currency: Currency;
    }
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private requestModifyCurrency(form: AddCurrency) {
    this.startLoading = true;
    this.currencyService
      .addCurrency(form)
      .then((result) => {
        if (
          typeof result.response === 'string' &&
          result.response.toLocaleLowerCase() === '1'.toLocaleLowerCase()
        ) {
          let dialog = AppUtilities.openSuccessMessageBox(
            this.successMessageBox,
            this.tr.translate(`setup.currency.modifiedCurrencySuccessfully`)
          );
          dialog.addEventListener('close', () => {
            this.added.emit();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.currency.form.dialog.failedToAddCurrency`)
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
  private requestAddCurrency(form: AddCurrency) {
    this.startLoading = true;
    this.currencyService
      .addCurrency(form)
      .then((result) => {
        if (
          typeof result.response === 'string' &&
          result.response.toLocaleLowerCase() ===
            'Created Successfuly'.toLocaleLowerCase()
        ) {
          let sal = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate(`setup.currency.createdCurrencySuccessfully`)
          );
          sal.then((res) => {
            this.added.emit();
          });
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`setup.currency.form.dialog.failedToAddCurrency`)
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
  private formErrors(errorsPath: string = 'setup.currency.form.dialog') {
    if (this.cname.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingName`)
      );
    }
    if (this.code.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.missingCode`)
      );
    }
  }
  private createForm() {
    this.currencyForm = this.fb.group({
      cname: this.fb.control('', [Validators.required]),
      code: this.fb.control('', [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
    });
  }
  private createEditForm(currency: Currency) {
    this.currencyForm = this.fb.group({
      cname: this.fb.control(currency.Currency_Name, [Validators.required]),
      code: this.fb.control(currency.Currency_Code, [Validators.required]),
      userid: this.fb.control(this.userProfile.Usno, [Validators.required]),
      sno: this.fb.control(1, [Validators.required]),
      dummy: this.fb.control(true, [Validators.required]),
    });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    if (this.data.currency) {
      this.createEditForm(this.data.currency);
    } else {
      this.createForm();
    }
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  setCurrencyValue(control: FormControl, value: string) {
    control.setValue(value.trim());
  }
  submitCurrencyForm() {
    if (this.currencyForm.valid) {
      this.confirmAddCurrency.nativeElement.showModal();
    } else {
      this.currencyForm.markAllAsTouched();
    }
  }
  addCurrency() {
    if (!this.data?.currency) {
      this.requestAddCurrency(this.currencyForm.value);
    } else {
      this.requestModifyCurrency(this.currencyForm.value);
    }
  }
  get cname() {
    return this.currencyForm.get('cname') as FormControl;
  }
  get code() {
    return this.currencyForm.get('code') as FormControl;
  }
}
