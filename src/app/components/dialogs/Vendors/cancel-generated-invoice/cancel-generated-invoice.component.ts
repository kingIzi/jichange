import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NO_ERRORS_SCHEMA,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
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
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { AddCancelForm } from 'src/app/core/models/vendors/forms/add-cancel-form';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { Observable, of } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CountryDialogComponent } from '../../bank/setup/country-dialog/country-dialog.component';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-cancel-generated-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
  ],
  templateUrl: './cancel-generated-invoice.component.html',
  styleUrl: './cancel-generated-invoice.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DatePipe,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
})
export class CancelGeneratedInvoiceComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
  public cancelledInvoice = new EventEmitter<number>();
  public generatedInvoice!: Observable<GeneratedInvoice>;
  @Output()
  @ViewChild('removeItem')
  removeItem!: ElementRef;
  // @Input() title: string = '';
  // @Input() message: string = '';
  // @Input() invoiceId!: number | string;
  // @Input() userId!: number | string;
  //public cancelInvoice = new EventEmitter<any>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('confirmCancelInvoice', { static: true })
  confirmCancelInvoice!: ElementRef<HTMLDialogElement>;
  constructor(
    private router: Router,
    private appConfig: AppConfigService,
    private fb: FormBuilder,
    private tr: TranslocoService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<CountryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { invid: number }
  ) {}
  private createFormGroup() {
    let loginResponse =
      this.appConfig.getLoginResponse() as VendorLoginResponse;
    this.formGroup = this.fb.group({
      userid: this.fb.control(loginResponse.Usno, [Validators.required]),
      reason: this.fb.control('', [Validators.required]),
      compid: this.fb.control(loginResponse.InstID, [Validators.required]),
      auname: this.fb.control('', []),
      invno: this.fb.control('', []),
      date: this.fb.control('', []),
      edate: this.fb.control('', []),
      iedate: this.fb.control('', []),
      ptype: this.fb.control('', []),
      chus: this.fb.control('', []),
      ccode: this.fb.control('', []),
      comno: this.fb.control(0, []),
      ctype: this.fb.control('0', []),
      cino: this.fb.control('0', []),
      twvat: this.fb.control(0, []),
      vtamou: this.fb.control(0, []),
      sno: this.fb.control(this.data.invid, []),
      lastrow: this.fb.control(0, []),
      Inv_remark: this.fb.control('', []),
      total: this.fb.control('', []),
      details: this.fb.array([], []),
    });
  }
  private formErrors(
    path: string = 'invoice.createdInvoice.cancelInvoice.form.dialog'
  ) {
    if (this.reason.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`errors.invalidForm`),
        this.tr.translate(`${path}.reason`)
      );
    }
  }
  private appendItems(details: GeneratedInvoice[]) {
    if (details.length > 0) {
      details.forEach((item) => {
        let group = this.fb.group({
          item_description: this.fb.control(item?.Item_Description?.trim(), []),
          item_qty: this.fb.control(Math.floor(item?.Item_Qty), []),
          item_unit_price: this.fb.control(item.Item_Unit_Price, []),
          item_total_amount: this.fb.control(item.Item_Total_Amount, []),
          remarks: this.fb.control(item?.Remarks?.trim()),
        });
        this.details.push(group);
      });
    }
  }
  private switchCancelInvoiceErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Invoice'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'You cannot cancel a paid invoice'.toLocaleLowerCase():
        return this.tr.translate(
          'invoice.createdInvoice.cancelInvoice.cannotCancelInvoice'
        );
      default:
        return this.tr.translate(
          'invoice.createdInvoice.cancelInvoice.form.dialog.failedToCancelInvoice'
        );
    }
  }
  private parseCancelInvoiceResponse(
    result: HttpDataResponse<GeneratedInvoice | number>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchCancelInvoiceErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      // let msg = AppUtilities.sweetAlertSuccessMessage(
      //   this.tr.translate(
      //     `invoice.createdInvoice.cancelInvoice.cancelledSuccessfully`
      //   )
      // );
      let path = '/vendor/reports/cancelled';
      let invoice = result.response as GeneratedInvoice;
      let queryParams = { invoiceId: btoa(invoice.Inv_Mas_Sno.toString()) };
      let message = this.tr.translate(
        `invoice.createdInvoice.cancelInvoice.cancelledSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        message,
        () =>
          this.router.navigate([path], {
            queryParams: queryParams,
          }),
        this.tr.translate('actions.view')
      );
      this.cancelledInvoice.emit(this.data.invid);
    }
  }
  private requestCancelInvoice(body: AddCancelForm) {
    this.startLoading = true;
    this.invoiceService
      .cancelInvoice(body)
      .then((result) => {
        this.parseCancelInvoiceResponse(result);
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
  private switchInvoiceByIdErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Invoice'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      default:
        return this.tr.translate('invoice.noGeneratedInvoicesFound');
    }
  }
  private parseInvoiceByIdRespone(
    result: HttpDataResponse<number | GeneratedInvoice>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchInvoiceByIdErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      this.generatedInvoice = of(result.response as GeneratedInvoice);
      this.modifyInvoiceFormGroup();
    }
  }
  private modifyInvoiceFormGroup() {
    this.generatedInvoice.subscribe((invoice) => {
      this.invno.setValue(invoice.Invoice_No ?? '');
      this.date.setValue(invoice.Invoice_Date);
      this.edate.setValue(invoice.Due_Date);
      this.iedate.setValue(invoice.Invoice_Expired_Date);
      this.ptype.setValue(invoice.Payment_Type ?? '');
      this.chus.setValue(invoice.Chus_Mas_No);
      this.ccode.setValue(invoice.Currency_Code);
      this.Inv_remark.setValue(invoice.Remarks ?? '');
      this.sno.setValue(invoice.Inv_Mas_Sno);
      this.appendItems(invoice.details ?? []);
      let total = invoice.details?.reduce((accumulator, currentValue) => {
        return accumulator + currentValue.Item_Total_Amount;
      }, 0);
      this.total.setValue(total);
    });
  }
  private buildPage() {
    this.startLoading = true;
    let compid = (this.appConfig.getLoginResponse() as VendorLoginResponse)
      .InstID;
    let inv = Number(this.data.invid);
    this.invoiceService
      .findInvoice({ compid: compid, inv: inv })
      .then((result) => {
        this.parseInvoiceByIdRespone(result);
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
    this.createFormGroup();
    this.buildPage();
  }
  closeDialog() {
    this.dialogRef.close({ data: 'Dialog closed' });
  }
  cancelInvoiceClicked() {
    this.requestCancelInvoice(this.formGroup.value);
  }
  submitCancelInvoice() {
    if (this.formGroup.valid) {
      this.confirmCancelInvoice.nativeElement.showModal();
      //this.requestCancelInvoice(this.formGroup.value);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  get reason() {
    return this.formGroup.get(`reason`) as FormControl;
  }
  get invno() {
    return this.formGroup.get('invno') as FormControl;
  }
  get date() {
    return this.formGroup.get('date') as FormControl;
  }
  get edate() {
    return this.formGroup.get('edate') as FormControl;
  }
  get iedate() {
    return this.formGroup.get('iedate') as FormControl;
  }
  get ptype() {
    return this.formGroup.get('ptype') as FormControl;
  }
  get chus() {
    return this.formGroup.get('chus') as FormControl;
  }
  get ccode() {
    return this.formGroup.get('ccode') as FormControl;
  }
  get Inv_remark() {
    return this.formGroup.get('Inv_remark') as FormControl;
  }
  get total() {
    return this.formGroup.get('total') as FormControl;
  }
  get auname() {
    return this.formGroup.get('auname') as FormControl;
  }
  get sno() {
    return this.formGroup.get('sno') as FormControl;
  }
  get details() {
    return this.formGroup.get('details') as FormArray;
  }
}
