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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TranslocoModule,
  TRANSLOCO_SCOPE,
  TranslocoService,
} from '@ngneat/transloco';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { CancelledDialogComponent } from '../../cancelled-dialog/cancelled-dialog.component';
import { DisplayMessageBoxComponent } from '../../display-message-box/display-message-box.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { from, zip, lastValueFrom, map, catchError } from 'rxjs';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { GeneratedInvoiceViewComponent } from '../generated-invoice-view/generated-invoice-view.component';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

@Component({
  selector: 'app-invoice-details-view',
  templateUrl: './invoice-details-view.component.html',
  styleUrl: './invoice-details-view.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    ReactiveFormsModule,
    CancelledDialogComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/generated', alias: 'generated' },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetailsViewComponent implements OnInit {
  public startLoading: boolean = false;
  public itemsData: any[] = [];
  public formGroup!: FormGroup;
  public invoices: GeneratedInvoice[] = [];
  public generatedInvoice!: GeneratedInvoice;
  public viewReady = new EventEmitter<HTMLFormElement>();
  public closeView = new EventEmitter<void>();
  @ViewChild('invoiceView', { static: true })
  invoiceView!: ElementRef<HTMLFormElement>;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private dialogRef: MatDialogRef<GeneratedInvoiceViewComponent>,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      Inv_Mas_Sno: string;
      userProfile: VendorLoginResponse;
    }
  ) {}
  private createForm() {
    this.formGroup = this.fb.group({
      invoiceNo: this.fb.control('', [Validators.required]),
      controlNo: this.fb.control('', [Validators.required]),
      dateIssued: this.fb.control(
        AppUtilities.convertDotNetJsonDateToDate('10/10/22'),
        []
      ),
      paymentType: this.fb.control('', []),
      issuedTo: this.fb.group({
        fullName: this.fb.control(''),
        address: this.fb.control('', []),
        city: this.fb.control('', []),
        phone: this.fb.control('', []),
      }),
      issuedBy: this.fb.group({
        fullName: this.fb.control('', []),
        address: this.fb.control('', []),
        city: this.fb.control('', []),
        phone: this.fb.control('', []),
      }),
      discount: this.fb.control('', []),
      items: this.fb.array([], []),
      remark: this.fb.control('', []),
      bankName: this.fb.control('', []),
      accountNo: this.fb.control(''),
      customerIdType: this.fb.control('', []),
      customerNo: this.fb.control('', []),
    });
  }
  private appendItems() {
    this.invoices.forEach((item) => {
      let group = this.fb.group({
        description: this.fb.control(item?.Item_Description?.trim(), []),
        quantity: this.fb.control(Math.floor(item?.Item_Qty), []),
        price: this.fb.control(item.Item_Unit_Price, []),
        total: this.fb.control(item.Item_Total_Amount, []),
      });
      this.items.push(group);
    });
  }
  private modifyFormGroup() {
    this.invoiceNo.setValue(this.generatedInvoice.Invoice_No);
    this.controlNo.setValue(this.generatedInvoice.Customer_ID_No);
    this.dateIssued.setValue(
      this.generatedInvoice.Invoice_Date
        ? AppUtilities.dateToFormat(
            new Date(this.generatedInvoice.Invoice_Date),
            'yyyy-MM-dd'
          )
        : ''
    );
    this.paymentType.setValue(
      this.generatedInvoice.Payment_Type
        ? this.generatedInvoice.Payment_Type.trim()
        : ''
    );
    (this.issuedTo.get('fullName') as FormControl).setValue(
      this.generatedInvoice.Chus_Name
    );
    (this.issuedBy.get('fullName') as FormControl).setValue(
      this.generatedInvoice.Company_Name
      //this.generatedInvoice.Cmpny_Name
    );
    this.discount.setValue('0%');
    this.remark.setValue(this.generatedInvoice.Remarks);
    this.customerIdType.setValue(
      this.generatedInvoice.Customer_ID_Type
        ? this.generatedInvoice.Customer_ID_Type
        : ''
    );
    this.customerNo.setValue(
      this.generatedInvoice.Customer_ID_Type &&
        this.generatedInvoice.Customer_ID_No
        ? this.generatedInvoice.Customer_ID_No
        : ''
    );
    //customerId: this.fb.control('',[]),
    //customerNo: this.fb.control('',[])
    this.appendItems();
  }
  private failedToRetrieveInvoice() {
    let dialog = AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`defaults.warning`),
      this.tr.translate(`generated.failedToRetrieveInvoice`)
    );
    dialog.addEventListener('close', () => {
      this.dialogRef.close();
    });
  }
  private noItemsFoundForInvoice() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`defaults.warning`),
      this.tr.translate(`generated.noItemsFound`)
    );
  }
  private switchFindInvoiceErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Invoice'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      default:
        return this.tr.translate('generated.failedToRetrieveInvoice');
    }
  }
  private parseApproveInvoiceResponse(
    result: HttpDataResponse<number | GeneratedInvoice>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchFindInvoiceErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      this.generatedInvoice = result.response as GeneratedInvoice;
      this.invoices = (result.response as GeneratedInvoice).details ?? [];
      this.modifyFormGroup();
      this.viewReady.emit(this.invoiceView.nativeElement);
    }
  }
  private async prepareInvoiceView() {
    this.startLoading = true;
    this.invoiceService
      .findInvoice({
        compid: this.data.userProfile.InstID,
        inv: Number(this.data.Inv_Mas_Sno),
      })
      .then((result) => {
        this.parseApproveInvoiceResponse(result);
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
  // private async prepareInvoiceView() {
  //   this.startLoading = true;
  //   let invoiceDetailsObservable = from(
  //     this.invoiceService.invoiceDetailsById({
  //       compid: this.data.userProfile.InstID,
  //       invid: Number(this.data.Inv_Mas_Sno),
  //     })
  //   );
  //   let invoiceItemObservable = from(
  //     this.invoiceService.invoiceItemDetails({
  //       invid: Number(this.data.Inv_Mas_Sno),
  //     })
  //   );
  //   let mergedObservable = zip(invoiceDetailsObservable, invoiceItemObservable);
  //   lastValueFrom(
  //     mergedObservable.pipe(
  //       map((result) => {
  //         return result;
  //       }),
  //       catchError((err) => {
  //         throw err;
  //       })
  //     )
  //   )
  //     .then((results) => {
  //       let [invoiceDetail, invoiceItems] = results;
  //       if (
  //         typeof invoiceDetail.response === 'string' ||
  //         typeof invoiceDetail.response === 'number'
  //       ) {
  //         this.failedToRetrieveInvoice();
  //       } else if (
  //         typeof invoiceItems.response === 'string' ||
  //         typeof invoiceItems.response === 'number'
  //       ) {
  //         this.noItemsFoundForInvoice();
  //       } else {
  //         this.generatedInvoice = invoiceDetail.response;
  //         this.invoices = invoiceItems.response;
  //         this.modifyFormGroup();
  //         this.viewReady.emit(this.invoiceView.nativeElement);
  //       }
  //       this.startLoading = false;
  //       this.cdr.detectChanges();
  //     })
  //     .catch((err) => {
  //       AppUtilities.requestFailedCatchError(
  //         err,
  //         this.displayMessageBox,
  //         this.tr
  //       );
  //       this.startLoading = false;
  //       this.cdr.detectChanges();
  //       throw err;
  //     });
  // }
  ngOnInit() {
    this.createForm();
    this.prepareInvoiceView();
  }
  formatDate(date: Date, format: string) {
    return AppUtilities.dateToFormat(date, format);
  }
  dateFormat(date: string) {
    return AppUtilities.convertDotNetJsonDateToDate(date).toDateString();
  }
  accumulateTotal() {
    let sum = this.items.controls.reduce(
      (total, item) => total + item.get('total')?.value,
      0
    );
    return this.moneyFormat(sum.toString());
  }
  moneyFormat(amount: string) {
    return AppUtilities.moneyFormat(amount);
  }
  get invoiceNo() {
    return this.formGroup.get('invoiceNo') as FormControl;
  }
  get controlNo() {
    return this.formGroup.get('controlNo') as FormControl;
  }
  get dateIssued() {
    return this.formGroup.get('dateIssued') as FormControl;
  }
  get paymentType() {
    return this.formGroup.get('paymentType') as FormControl;
  }
  get issuedTo() {
    return this.formGroup.get('issuedTo') as FormGroup;
  }
  get issuedBy() {
    return this.formGroup.get('issuedBy') as FormGroup;
  }
  get discount() {
    return this.formGroup.get('discount') as FormControl;
  }
  get items() {
    return this.formGroup.get('items') as FormArray;
  }
  get remark() {
    return this.formGroup.get('remark') as FormControl;
  }
  get bankName() {
    return this.formGroup.get('bankName') as FormControl;
  }
  get accountNo() {
    return this.formGroup.get('accountNo') as FormControl;
  }
  get customerIdType() {
    return this.formGroup.get('customerIdType') as FormControl;
  }
  get customerNo() {
    return this.formGroup.get(`customerNo`) as FormControl;
  }
}
