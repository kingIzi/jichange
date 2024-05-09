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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratedInvoiceListComponent implements OnInit, AfterViewInit {
  private userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public generatedInvoices: GeneratedInvoice[] = [];
  public generatedInvoicesData: GeneratedInvoice[] = [];
  public tableHeadersFormGroup!: FormGroup;
  PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public headersMap = {
    CUSTOMER_NAME: 0,
    INVOICE_NUMBER: 1,
    INVOICE_DATE: 2,
    PAYMENT_TYPE: 3,
    TOTAL_AMOUNT: 4,
    DELIVERY_STATUS: 5,
  };
  @ViewChild('generatedInvoiceTable', { static: true })
  generatedInvoiceTable!: ElementRef<HTMLTableElement>;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
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
    });
    this.tr
      .selectTranslate('generatedInvoicesTable', {}, this.scope)
      .subscribe((labels: string[]) => {
        labels.forEach((label, index) => {
          let header = this.fb.group({
            label: this.fb.control(label, []),
            search: this.fb.control('', []),
            sortAsc: this.fb.control('', []),
            values: this.fb.array([], []),
            included: this.fb.control(index < 5, []),
          });
          this.tableHeaderFilterValues(header, index);
          header.get('sortAsc')?.valueChanges.subscribe((value: any) => {
            if (value === true) {
              this.sortTableAsc(index);
            } else {
              this.sortTableDesc(index);
            }
          });
          this.headers.push(header);
        });
      });
  }
  //creates a name and an active state FormControl, filtering data when the active state changes
  private tableHeaderFilterValues(header: FormGroup, index: number) {
    let values: string[] = this.getTableColumnDataVariations(index);
    values.forEach((elem) => {
      let value = this.fb.group({
        name: this.fb.control(elem.trim(), []),
        isActive: this.fb.control(true, []),
      });
      value.get('isActive')?.valueChanges.subscribe((value: string | any) => {
        let filteringIndexes = [
          this.headersMap.DELIVERY_STATUS,
          this.headersMap.PAYMENT_TYPE,
        ];
        this.generatedInvoices = this.filterTable(filteringIndexes);
      });
      (header.get('values') as FormArray).push(value);
    });
  }
  //finds the inActive values within the formArrays and filters their data
  private filterTable(indexes: number[]) {
    let [deliveryStatus, paymentType] = indexes;
    let deliveryStatusArr = this.headers
      ?.at(deliveryStatus)
      ?.get('values') as FormArray;
    let payments = this.headers?.at(paymentType)?.get('values') as FormArray;
    let deliveryStatusValues = deliveryStatusArr.controls
      .filter((v) => v.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    let paymentValues = payments.controls
      .filter((p) => p.get('isActive')?.value)
      .map((f) => f.get('name')?.value.toLocaleLowerCase());
    if (!deliveryStatusValues || !paymentValues) {
      return [];
    }
    return this.generatedInvoicesData.filter((f) => {
      return (
        deliveryStatusValues.indexOf(
          f.delivery_status.trim().toLocaleLowerCase()
        ) !== -1 &&
        paymentValues.indexOf(f.Payment_Type.trim().toLocaleLowerCase()) !== -1
      );
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case this.headersMap.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No > b.Invoice_No ? 1 : -1
        );
        break;
      case this.headersMap.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) > new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case this.headersMap.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a?.Chus_Name?.trim() > b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() > b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total > b.Total ? 1 : -1));
        break;
      case this.headersMap.DELIVERY_STATUS:
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
      case this.headersMap.INVOICE_NUMBER:
        this.generatedInvoices.sort((a, b) =>
          a.Invoice_No < b.Invoice_No ? 1 : -1
        );
        break;
      case this.headersMap.INVOICE_DATE:
        this.generatedInvoices.sort((a, b) =>
          new Date(a.Invoice_Date) < new Date(b.Invoice_Date) ? 1 : -1
        );
        break;
      case this.headersMap.CUSTOMER_NAME:
        this.generatedInvoices.sort((a, b) =>
          a?.Chus_Name?.trim() < b?.Chus_Name?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.PAYMENT_TYPE:
        this.generatedInvoices.sort((a, b) =>
          a?.Payment_Type?.trim() < b?.Payment_Type?.trim() ? 1 : -1
        );
        break;
      case this.headersMap.TOTAL_AMOUNT:
        this.generatedInvoices.sort((a, b) => (a.Total < b.Total ? 1 : -1));
        break;
      case this.headersMap.DELIVERY_STATUS:
        this.generatedInvoices.sort((a, b) =>
          a?.delivery_status?.trim() < b?.delivery_status?.trim() ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  //Given a column index, this function returns all unique values of the specified key in the arrays.
  private getTableColumnDataVariations(ind: number) {
    switch (ind) {
      case this.headersMap.DELIVERY_STATUS:
        let delivery_statusArr = new Set(
          this.generatedInvoicesData.map((elem) => elem.delivery_status)
        );
        return delivery_statusArr.size <= 10 ? [...delivery_statusArr] : [];
      case this.headersMap.PAYMENT_TYPE:
        let paymentType = new Set(
          this.generatedInvoicesData.map((e) => e.Payment_Type)
        );
        return paymentType.size <= 10 ? [...paymentType] : [];
      default:
        return [];
    }
  }
  private requestGeneratedInvoice() {
    this.startLoading = true;
    this.invoiceService
      .postSignedDetails({ compid: this.userProfile.InstID })
      .then((results: any) => {
        this.generatedInvoicesData =
          results.response === 0 ? [] : results.response;
        this.generatedInvoices = this.generatedInvoicesData;
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
  //action to sort table by column
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    if (!sortAsc?.value) {
      this.sortTableDesc(ind);
      sortAsc?.setValue(true);
    } else {
      this.sortTableAsc(ind);
      sortAsc?.setValue(false);
    }
  }
  //opens remove table row dialog
  cancelInvoice(id: number, dialog: CancelGeneratedInvoiceComponent) {
    dialog.title = this.tr.translate(`defaults.warning`);
    dialog.message = this.tr.translate(`generated.cancelInvoice`);
    dialog.openDialog();
    dialog.cancelInvoice.asObservable().subscribe((e) => {
      this.generatedInvoices.splice(id, 1);
      this.successMessageBox.title = 'Invoice deleted successfully!';
      this.successMessageBox.openDialog();
    });
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
  searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      let text = searchText.toLocaleLowerCase();
      this.generatedInvoices = this.generatedInvoicesData.filter(
        (elem: GeneratedInvoice) => {
          return (
            elem?.Chus_Name?.toLocaleLowerCase().includes(text) ||
            elem.Invoice_No.toLocaleLowerCase().includes(text)
          );
        }
      );
      paginator.firstPage();
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
        headersMap: this.headersMap,
        headers: this.headers.controls.map((c) => c.get('label')?.value),
        generatedInvoices: this.generatedInvoicesData,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
  //opens invoice view
  openGeneratedInvoiceView(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(GeneratedInvoiceViewComponent, {
      width: '800px',
      height: '700px',
      data: {
        Inv_Mas_Sno: generatedInvoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
      },
    });
  }
  //opens invoice details for editing
  openInvoiceDetailsView(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(InvoiceDetailsDialogComponent, {
      width: '800px',
      height: '700px',
      disableClose: true,
      data: {
        invid: generatedInvoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
      },
    });
  }
  //saves a copy of an invoice to the local machine
  downloadInvoice(generatedInvoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(GeneratedInvoiceViewComponent, {
      width: '800px',
      data: {
        Inv_Mas_Sno: generatedInvoice.Inv_Mas_Sno,
        userProfile: this.userProfile,
      },
    });
    dialogRef.componentInstance.viewReady.asObservable().subscribe((view) => {
      this.fileHandler
        .downloadPdf(view, 'generated-invoice.pdf')
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
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
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
    return index === this.headersMap.TOTAL_AMOUNT;
  }
  get headers() {
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
}
