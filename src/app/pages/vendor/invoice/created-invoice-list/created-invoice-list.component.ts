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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import {
  from,
  zip,
  lastValueFrom,
  map,
  catchError,
  Observable,
  of,
} from 'rxjs';
import { CancelGeneratedInvoiceComponent } from 'src/app/components/dialogs/Vendors/cancel-generated-invoice/cancel-generated-invoice.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { GeneratedInvoiceViewComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-view/generated-invoice-view.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { InvoiceDetailsViewComponent } from 'src/app/components/dialogs/Vendors/invoice-details-view/invoice-details-view.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { InvoiceListTable } from 'src/app/core/enums/vendor/invoices/invoice-list-table';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
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
    MatTableModule,
    MatSortModule,
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
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public tableData: {
    invoiceList: GeneratedInvoice[];
    originalTableColumns: TableColumnsData[];
    tableColumns: TableColumnsData[];
    tableColumns$: Observable<TableColumnsData[]>;
    dataSource: MatTableDataSource<GeneratedInvoice>;
  } = {
    invoiceList: [],
    originalTableColumns: [],
    tableColumns: [],
    tableColumns$: of([]),
    dataSource: new MatTableDataSource<GeneratedInvoice>([]),
  };
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
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
    let TABLE_SHOWING = 8;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`createdInvoice.createdInvoiceTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableData.originalTableColumns = labels;
        this.tableData.originalTableColumns.forEach((column, index) => {
          let col = this.fb.group({
            included: this.fb.control(
              index === 0
                ? false
                : index < TABLE_SHOWING || index === labels.length - 1,
              []
            ),
            label: this.fb.control(column.label, []),
            value: this.fb.control(column.value, []),
          });
          col.get(`included`)?.valueChanges.subscribe((included) => {
            this.resetTableColumns();
          });
          if (index === labels.length - 1) {
            col.disable();
          }
          this.headers.push(col);
        });
        this.resetTableColumns();
      });
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private resetTableColumns() {
    this.tableData.tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableData.tableColumns$ = of(this.tableData.tableColumns);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.tableData.dataSource.filter = searchText.trim().toLowerCase();
    if (this.tableData.dataSource.paginator) {
      this.tableData.dataSource.paginator.firstPage();
    }
  }
  private dataSourceFilter() {
    this.tableData.dataSource.filterPredicate = (
      data: GeneratedInvoice,
      filter: string
    ) => {
      return (
        data.Chus_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        ) ||
        data.Invoice_No.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
      );
    };
  }
  private dataSourceSortingAccessor() {
    this.tableData.dataSource.sortingDataAccessor = (
      item: any,
      property: string
    ) => {
      switch (property) {
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.tableData.dataSource = new MatTableDataSource<GeneratedInvoice>(
      this.tableData.invoiceList
    );
    this.tableData.dataSource.paginator = this.paginator;
    this.tableData.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private assignCreatedInvoiceDataList(
    result: HttpDataResponse<string | number | GeneratedInvoice[]>
  ) {
    if (
      result.response &&
      typeof result.response !== 'string' &&
      typeof result.response !== 'number' &&
      result.response.length > 0
    ) {
      this.tableData.invoiceList = result.response;
    } else {
      this.tableData.invoiceList = [];
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        this.tr.translate(`invoice.noInvoices`)
      );
    }
    this.prepareDataSource();
  }
  private requestCreatedInvoiceList() {
    this.tableData.invoiceList = [];
    this.tableLoading = true;
    this.invoiceService
      .getCreatedInvoiceList({ compid: this.userProfile.InstID })
      .then((result) => {
        this.assignCreatedInvoiceDataList(result);
        this.tableLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.tableData.invoiceList = [];
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
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableData.invoiceList,
          element
        );
      case 'Invoice_Date':
        return PerformanceUtils.convertDateStringToDate(
          element[key]
        ).toDateString();
      case 'Total':
        return (
          PerformanceUtils.moneyFormat(element[key].toString()) +
          ' ' +
          element['Currency_Code']
        );
      default:
        return element[key];
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Chus_Name':
        return `${style} text-black font-semibold`;
      case 'Payment_Type':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.Payment_Type,
          `Fixed`,
          `bg-purple-100`,
          `text-purple-700`,
          `bg-teal-100`,
          `text-teal-700`
        )} text-center w-fit`;
      case 'goods_status':
        return `${PerformanceUtils.getActiveStatusStyles(
          element.goods_status,
          'Approved',
          'bg-green-100',
          'text-green-700',
          'bg-orange-100',
          'text-orange-700'
        )} w-fit`;
      case 'Total':
        return `${style} text-right`;
      default:
        return `${style} text-black font-normal`;
    }
  }
  tableHeaderStyle(key: string) {
    let style = 'flex flex-row items-center';
    switch (key) {
      case 'Total':
      case 'Action':
        return `${style} justify-end`;
      default:
        return `${style}`;
    }
  }
  tableSortableColumns(column: TableColumnsData) {
    switch (column.value) {
      case 'Total':
      case 'Chus_Name':
      case 'Invoice_No':
      case 'Payment_Type':
      case 'Invoice_Date':
      case 'goods_status':
        return column.value;
      default:
        return '';
    }
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
