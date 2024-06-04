import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
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
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { GeneratedInvoiceViewComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-view/generated-invoice-view.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { LoginResponse } from 'src/app/core/models/login-response';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { CancelGeneratedInvoiceComponent } from 'src/app/components/dialogs/Vendors/cancel-generated-invoice/cancel-generated-invoice.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { GeneratedInvoiceListTable } from 'src/app/core/enums/vendor/invoices/generated-invoice-list-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { AmendmentDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/amendment-details-dialog/amendment-details-dialog.component';

@Component({
  selector: 'app-generated-invoice-list',
  templateUrl: './generated-invoice-list.component.html',
  styleUrls: ['./generated-invoice-list.component.scss'],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/generated', alias: 'generated' },
    },
  ],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoModule,
    NgxLoadingModule,
    MatDialogModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    SuccessMessageBoxComponent,
    TableDateFiltersComponent,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    LoaderRainbowComponent,
    CancelGeneratedInvoiceComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratedInvoiceListComponent implements OnInit, AfterViewInit {
  public userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public generatedInvoices: GeneratedInvoice[] = [];
  public generatedInvoicesData: GeneratedInvoice[] = [];
  public tableHeadersFormGroup!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public InvoiceListTable: typeof GeneratedInvoiceListTable =
    GeneratedInvoiceListTable;
  @ViewChild('generatedInvoiceTable', { static: true })
  generatedInvoiceTable!: ElementRef<HTMLTableElement>;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private dialog: MatDialog,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private fileHandler: FileHandlerService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  //create formGroup for each header item in table
  private createHeadersForm() {
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `generatedInvoicesTable`,
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
      case GeneratedInvoiceListTable.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No > b.Invoice_No ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) > new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a?.Chus_Name?.trim() > b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() > b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total > b.Total ? 1 : -1));
        break;
      case GeneratedInvoiceListTable.DELIVERY_STATUS:
        this.generatedInvoices.sort((a, b) =>
          a?.delivery_status?.trim() > b?.delivery_status.trim() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case GeneratedInvoiceListTable.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No < b.Invoice_No ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) < new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a?.Chus_Name?.trim() < b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() < b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case GeneratedInvoiceListTable.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total < b.Total ? 1 : -1));
        break;
      case GeneratedInvoiceListTable.DELIVERY_STATUS:
        this.generatedInvoices.sort((a, b) =>
          a?.delivery_status?.trim() < b?.delivery_status?.trim() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private requestGeneratedInvoice() {
    this.tableLoading = true;
    this.invoiceService
      .postSignedDetails({ compid: this.userProfile.InstID })
      .then((result) => {
        if (typeof result.response === 'string') {
        } else {
          this.generatedInvoicesData = result.response;
          this.generatedInvoices = this.generatedInvoicesData;
        }
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        AppUtilities.requestFailedCatchError(
          err,
          this.displayMessageBox,
          this.tr
        );
        this.tableLoading = false;
        this.cdr.detectChanges();
      });
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeadersForm();
    this.requestGeneratedInvoice();
  }
  ngAfterViewInit(): void {}
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  moneyFormat(value: string) {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  convertDotNetJSONDate(dotNetJSONDate: string) {
    const timestamp = parseInt(
      dotNetJSONDate.replace(/\/Date\((\d+)\)\//, '$1'),
      10
    );
    return new Date(timestamp).toLocaleDateString();
  }
  //action to filter table by search key up
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.toLocaleLowerCase();
      this.generatedInvoices = this.generatedInvoicesData.filter(
        (elem: GeneratedInvoice) => {
          return (
            elem?.Chus_Name?.toLocaleLowerCase().includes(text) ||
            elem.Invoice_No.toLocaleLowerCase().includes(text)
          );
        }
      );
    } else {
      this.generatedInvoices = this.generatedInvoicesData;
    }
  }
  //opens generate chart dialog
  openGeneratedInvoiceChart() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: GeneratedInvoiceListTable,
        headers: this.headers.controls.map((c) => c.get('label')?.value),
        generatedInvoices: this.generatedInvoicesData,
      },
    });
  }
  //opens invoice view
  openGeneratedInvoiceView(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(GeneratedInvoiceViewComponent, {
      width: '800px',
      //height: '700px',
      data: {
        Inv_Mas_Sno: generatedInvoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
      },
    });
  }
  //saves a copy of an invoice to the local machine
  downloadInvoice(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(GeneratedInvoiceViewComponent, {
      width: '800px',
      height: '700px',
      data: {
        Inv_Mas_Sno: generatedInvoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
      },
    });
    dialogRef.componentInstance.viewReady.asObservable().subscribe((view) => {
      this.fileHandler
        .downloadPdf(
          view,
          `generated-invoice-${generatedInvoice.Invoice_No}.pdf`
        )
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
  //returns a form control given a name
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  //verifies if table is being filtered
  hasInactiveValue(ind: number) {
    let values = this.headers.at(ind).get('values') as FormArray;
    return values.controls.find((c) => !c.get('isActive')?.value)
      ? true
      : false;
  }
  openInvoiceDetailsDialog() {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      disableClose: true,
    });
    dialogRef.componentInstance.addedInvoice.asObservable().subscribe(() => {
      dialogRef.close();
      let m = AppUtilities.sweetAlertSuccessMessage(
        this.tr.translate('generated.addedInvoiceSuccessfully')
      );
      this.requestGeneratedInvoice();
    });
  }
  openAmmendInvoiceDialog(invoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(AmendmentDetailsDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        invid: invoice.Inv_Mas_Sno,
      },
    });
    dialogRef.componentInstance.amended.asObservable().subscribe(() => {
      dialogRef.close();
      this.requestGeneratedInvoice();
    });
  }
  getActiveStatusStyles(status: string) {
    return status
      ? status.toLocaleLowerCase() === 'active'
        ? 'bg-green-100 text-green-600 px-4 py-1 rounded-lg shadow'
        : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow'
      : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow';
  }
  isCashAmountColumn(index: number) {
    return index === GeneratedInvoiceListTable.TOTAL_AMOUNT;
  }
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
      this.requestGeneratedInvoice();
      //this.requestCreatedInvoiceList();
    });
    dialog.openDialog();
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
