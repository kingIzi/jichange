import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { from, zip, lastValueFrom, map, catchError } from 'rxjs';
import { CancelGeneratedInvoiceComponent } from 'src/app/components/dialogs/Vendors/cancel-generated-invoice/cancel-generated-invoice.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { GeneratedInvoiceViewComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-view/generated-invoice-view.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { InvoiceDetailsViewComponent } from 'src/app/components/dialogs/Vendors/invoice-details-view/invoice-details-view.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { InvoiceListTable } from 'src/app/core/enums/vendor/invoices/invoice-list-table';
import { LoginResponse } from 'src/app/core/models/login-response';
import { AddInvoiceForm } from 'src/app/core/models/vendors/forms/add-invoice-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-created-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    LoaderInfiniteSpinnerComponent,
    TranslocoModule,
    DisplayMessageBoxComponent,
    SuccessMessageBoxComponent,
    MatDialogModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    CancelGeneratedInvoiceComponent,
    SubmitMessageBoxComponent,
  ],
  templateUrl: './created-invoice-list.component.html',
  styleUrl: './created-invoice-list.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatedInvoiceListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public tableHeadersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public InvoiceListTable: typeof InvoiceListTable = InvoiceListTable;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public invoiceList: GeneratedInvoice[] = [];
  public invoiceListData: GeneratedInvoice[] = [];
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private fileHandler: FileHandlerService,
    private invoiceService: InvoiceService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createTableHeadersFormGroup() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `createdInvoice.createdInvoiceTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      6,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case InvoiceListTable.INVOICE_NUMBER:
        this.invoiceList.sort((a, b) => (a.Invoice_No > b.Invoice_No ? 1 : -1));
        break;
      case InvoiceListTable.INVOICE_DATE:
        this.invoiceList.sort((a, b) =>
          new Date(a.Invoice_Date) > new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case InvoiceListTable.CUSTOMER_NAME:
        this.invoiceList.sort((a, b) =>
          a?.Chus_Name?.trim() > b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case InvoiceListTable.PAYMENT_TYPE:
        this.invoiceList.sort((a, b) =>
          a?.Payment_Type?.trim() > b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case InvoiceListTable.TOTAL_AMOUNT:
        this.invoiceList.sort((a, b) => (a.Total > b.Total ? 1 : -1));
        break;
      case InvoiceListTable.APPROVAL_STATUS:
        this.invoiceList.sort((a, b) =>
          a?.approval_status?.trim() > b?.approval_status.trim() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case InvoiceListTable.INVOICE_NUMBER:
        this.invoiceList.sort((a, b) => (a.Invoice_No < b.Invoice_No ? 1 : -1));
        break;
      case InvoiceListTable.INVOICE_DATE:
        this.invoiceList.sort((a, b) =>
          new Date(a.Invoice_Date) < new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case InvoiceListTable.CUSTOMER_NAME:
        this.invoiceList.sort((a, b) =>
          a?.Chus_Name?.trim() < b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case InvoiceListTable.PAYMENT_TYPE:
        this.invoiceList.sort((a, b) =>
          a?.Payment_Type?.trim() < b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case InvoiceListTable.TOTAL_AMOUNT:
        this.invoiceList.sort((a, b) => (a.Total < b.Total ? 1 : -1));
        break;
      case InvoiceListTable.APPROVAL_STATUS:
        this.invoiceList.sort((a, b) =>
          a?.approval_status?.trim() < b?.approval_status?.trim() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.invoiceList = this.invoiceListData.filter(
        (elem: GeneratedInvoice) => {
          return (
            elem?.Chus_Name?.toLocaleLowerCase().includes(text) ||
            elem.Invoice_No.toLocaleLowerCase().includes(text)
          );
        }
      );
    } else {
      this.invoiceList = this.invoiceListData;
    }
  }
  private requestCreatedInvoiceList() {
    this.tableLoading = true;
    this.invoiceService
      .getCreatedInvoiceList({ compid: this.userProfile.InstID })
      .then((result) => {
        if (typeof result.response === 'string') {
        } else {
          this.invoiceListData = result.response;
          this.invoiceList = this.invoiceListData;
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.invoiceListData = [];
        this.invoiceList = this.invoiceListData;
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private prepareInvoiceFormGroup() {
    let form = this.fb.group({
      user_id: this.fb.control(this.userProfile.Usno, [Validators.required]),
      compid: this.fb.control(this.userProfile.InstID.toString(), [
        Validators.required,
      ]),
      auname: this.fb.control('', [Validators.required]),
      invno: this.fb.control('', [Validators.required]),
      date: this.fb.control('', [Validators.required]),
      edate: this.fb.control('', [Validators.required]),
      iedate: this.fb.control('', [Validators.required]),
      ptype: this.fb.control('', [Validators.required]),
      chus: this.fb.control('', [Validators.required]),
      ccode: this.fb.control('', [Validators.required]),
      comno: this.fb.control(0, [Validators.required]),
      ctype: this.fb.control('0', [Validators.required]),
      cino: this.fb.control('0', [Validators.required]),
      twvat: this.fb.control(0, [Validators.required]),
      vtamou: this.fb.control(0, [Validators.required]),
      sno: this.fb.control(0, [Validators.required]),
      lastrow: this.fb.control(0, [Validators.required]),
      Inv_remark: this.fb.control('', []),
      goods_status: this.fb.control('', []),
      total: this.fb.control('', [Validators.required]),
      details: this.fb.array([], [Validators.required]),
    });
    return form;
  }
  private modifyInvoiceDetailsForm(
    formGroup: FormGroup,
    invoice: GeneratedInvoice,
    items: GeneratedInvoice[]
  ) {
    formGroup.get('invno')?.setValue(invoice.Invoice_No);
    formGroup
      .get('date')
      ?.setValue(
        invoice.Invoice_Date
          ? AppUtilities.dateToFormat(
              new Date(invoice.Invoice_Date),
              'yyyy-MM-dd'
            )
          : ''
      );
    formGroup
      .get('edate')
      ?.setValue(
        invoice.Due_Date
          ? AppUtilities.dateToFormat(new Date(invoice.Due_Date), 'yyyy-MM-dd')
          : ''
      );
    formGroup
      .get('iedate')
      ?.setValue(
        invoice.Invoice_Expired_Date
          ? AppUtilities.dateToFormat(
              new Date(invoice.Invoice_Expired_Date),
              'yyyy-MM-dd'
            )
          : ''
      );
    formGroup.get('ptype')?.setValue(invoice.Payment_Type ?? '');
    formGroup.get('chus')?.setValue(invoice.Chus_Mas_No);
    formGroup.get('ccode')?.setValue(invoice.Currency_Code);
    formGroup.get('Inv_remark')?.setValue(invoice.Remarks ?? '');
    formGroup.get('sno')?.setValue(invoice.Inv_Mas_Sno);
    formGroup.get('goods_status')?.setValue('Approve');
    formGroup
      .get('total')
      ?.setValue(AppUtilities.moneyFormat(invoice.Total.toString()));
    formGroup
      .get('auname')
      ?.setValue(AppUtilities.moneyFormat(invoice.Total.toString()));
    this.addApprovalInvoiceItemDetails(formGroup, items);
  }
  private addApprovalInvoiceItemDetails(
    formGroup: FormGroup,
    items: GeneratedInvoice[]
  ) {
    items.forEach((item) => {
      let group = this.fb.group({
        item_description: this.fb.control(item?.Item_Description?.trim(), []),
        item_qty: this.fb.control(Math.floor(item?.Item_Qty), []),
        item_unit_price: this.fb.control(item.Item_Unit_Price, []),
        item_total_amount: this.fb.control(item.Item_Total_Amount, []),
        remarks: this.fb.control(item?.Remarks?.trim()),
      });
      (formGroup.get('details') as FormArray).push(group);
      this.itemDetailQuantityPriceChanged(group);
    });
  }
  private itemDetailQuantityPriceChanged(group: FormGroup) {
    group.get('item_unit_price')?.valueChanges.subscribe((value) => {
      let itemQtyControl = group.get('item_qty');
      if (value && itemQtyControl?.value && value > 0) {
        let acc = value * itemQtyControl?.value;
        group.get('item_total_amount')?.setValue(acc);
      }
    });
    group.get('item_qty')?.valueChanges.subscribe((value) => {
      let itemUnitPriceCOntrol = group.get('item_unit_price');
      if (value && itemUnitPriceCOntrol?.value && value > 0) {
        let acc = value * itemUnitPriceCOntrol?.value;
        group.get('item_total_amount')?.setValue(acc);
      }
    });
  }
  private failedToApproveInvoice() {
    AppUtilities.openDisplayMessageBox(
      this.displayMessageBox,
      this.tr.translate(`defaults.failed`),
      this.tr.translate(`invoice.form.dialog.invoiceExists`)
    );
  }
  private requestAddInvoiceForm(value: AddInvoiceForm) {
    this.startLoading = true;
    this.invoiceService
      .addInvoice(value)
      .then((results: any) => {
        if (results.response === 0 || results.response === 'EXIST') {
          this.failedToApproveInvoice();
        } else {
          let m = AppUtilities.sweetAlertSuccessMessage(
            this.tr.translate('invoice.form.dialog.invoiceApprovedSuccessfully')
          );
          this.requestCreatedInvoiceList();
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
  private requestApproveCompany(invoice: GeneratedInvoice) {
    this.startLoading = true;
    let invoiceDetailsObservable = from(
      this.invoiceService.invoiceDetailsById({
        compid: this.userProfile.InstID,
        invid: Number(invoice.Inv_Mas_Sno),
      })
    );
    let invoiceItemObservable = from(
      this.invoiceService.invoiceItemDetails({
        invid: Number(invoice.Inv_Mas_Sno),
      })
    );
    let mergedObservable = zip(invoiceDetailsObservable, invoiceItemObservable);
    let res = AppUtilities.pipedObservables(mergedObservable);
    res
      .then((results) => {
        let [invoiceDetail, invoiceItems] = results;
        let hasInvoiceDetail =
          invoiceDetail.response &&
          typeof invoiceDetail.response !== 'string' &&
          typeof invoiceDetail.response !== 'number';
        let hasInvoiceItems =
          invoiceItems.response &&
          typeof invoiceItems.response !== 'string' &&
          typeof invoiceItems.response !== 'number';
        if (hasInvoiceDetail && hasInvoiceItems) {
          let formGroup = this.prepareInvoiceFormGroup();
          this.modifyInvoiceDetailsForm(
            formGroup,
            invoiceDetail.response,
            invoiceItems.response
          );
          this.requestAddInvoiceForm(formGroup.value as any);
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
    this.createTableHeadersFormGroup();
    this.requestCreatedInvoiceList();
  }
  //returns a form control given a name
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  openInvoiceDetailsDialog() {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        invid: null,
        userProfile: this.userProfile,
        customerId: null,
      },
    });
    dialogRef.componentInstance.addedInvoice.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestCreatedInvoiceList();
    });
  }
  //opens invoice view
  openInvoiceReportView(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(InvoiceDetailsViewComponent, {
      width: '800px',
      height: '700px',
      data: {
        Inv_Mas_Sno: generatedInvoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
      },
    });
  }
  //opens invoice details for editing
  openEditInvoiceDialog(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      height: '700px',
      disableClose: true,
      data: {
        invid: generatedInvoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
        customerId: null,
      },
    });
    dialogRef.componentInstance.addedInvoice.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestCreatedInvoiceList();
    });
  }
  //saves a copy of an invoice to the local machine
  downloadInvoice(invoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(InvoiceDetailsViewComponent, {
      width: '800px',
      height: '800px',
      data: {
        Inv_Mas_Sno: invoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
      },
    });
    dialogRef.componentInstance.viewReady.asObservable().subscribe((view) => {
      this.fileHandler
        .downloadPdf(view, `invoice-${invoice.Invoice_No}.pdf`)
        .then((results) => {
          this.cdr.detectChanges();
        })
        .catch((err) => {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`errors.errorOccured`),
            this.tr.translate(`generated.errors.failedToDownload`)
          );
          throw err;
        });
    });
  }
  //cancels created invoice
  cancelInvoice(
    invoice: GeneratedInvoice,
    dialog: CancelGeneratedInvoiceComponent
  ) {
    dialog.title = this.tr.translate(`defaults.warning`);
    dialog.message = this.tr
      .translate(`invoice.createdInvoice.sureCancelInvoice`)
      .replace('{}', invoice.Invoice_No);
    dialog.userId = this.userProfile.Usno;
    dialog.invoiceId = invoice.Inv_Mas_Sno;
    dialog.cancelledInvoice.asObservable().subscribe(() => {
      dialog.closeDialog();
      this.requestCreatedInvoiceList();
    });
    dialog.openDialog();
  }
  //approve status
  approveInvoice(invoice: GeneratedInvoice, dialog: SubmitMessageBoxComponent) {
    dialog.title = this.tr.translate('defaults.confirm');
    dialog.message = this.tr
      .translate('invoice.createdInvoice.sureApproveInvoice')
      .replace('{}', invoice.Invoice_No);
    dialog.openDialog();
    dialog.confirm.asObservable().subscribe(() => {
      this.requestApproveCompany(invoice);
      dialog.closeDialog();
    });
  }
  determineApprovalStatus(status: string) {
    if (!status) {
      return '-';
    } else if (status.trim().toLocaleLowerCase() == '1') {
      return 'Approve';
    } else if (status.trim().toLocaleLowerCase() == '2') {
      return 'Done';
    }
    return '-';
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
