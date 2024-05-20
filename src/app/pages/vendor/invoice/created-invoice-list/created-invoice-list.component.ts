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
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
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
      this
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
        // this.invoiceListData = result.response;
        // this.invoiceList = this.invoiceListData;
        // this.tableLoading = false;
        // this.cdr.detectChanges();
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
    // let dialogRef = this.dialog.open(GeneratedInvoiceViewComponent, {
    //   width: '800px',
    //   height: '700px',
    //   data: {
    //     Inv_Mas_Sno: generatedInvoice.Inv_Mas_Sno,
    //     userProfile: this.userProfile,
    //   },
    // });
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
      alert(`approved invoice`);
      dialog.closeDialog();
    });
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
