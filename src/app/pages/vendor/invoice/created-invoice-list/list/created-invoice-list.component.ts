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
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { CancelGeneratedInvoiceComponent } from 'src/app/components/dialogs/Vendors/cancel-generated-invoice/cancel-generated-invoice.component';
import { InvoiceDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/invoice-details-dialog/invoice-details-dialog.component';
import { InvoiceDetailsViewComponent } from 'src/app/components/dialogs/Vendors/invoice-details-view/invoice-details-view.component';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import { AddInvoiceForm } from 'src/app/core/models/vendors/forms/add-invoice-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';

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
    RouterLink,
    MatTooltipModule,
  ],
  templateUrl: './created-invoice-list.component.html',
  styleUrl: './created-invoice-list.component.scss',
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/invoice', alias: 'invoice' },
    },
    {
      provide: VENDOR_TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class CreatedInvoiceListComponent implements OnInit {
  public tableHeadersFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private fileHandler: FileHandlerService,
    private invoiceService: InvoiceService,
    private tr: TranslocoService,
    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<GeneratedInvoice>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createTableHeadersFormGroup() {
    let TABLE_SHOWING = 9;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`createdInvoice.createdInvoiceTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.tableDataService.setOriginalTableColumns(labels);
        this.tableDataService
          .getOriginalTableColumns()
          .forEach((column, index) => {
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
      this.tableDataService.searchTable(value);
    });
  }
  private resetTableColumns() {
    let tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableDataService.setTableColumns(tableColumns);
    this.tableDataService.setTableColumnsObservable(tableColumns);
  }
  private dataSourceFilterPredicate() {
    let filterPredicate = (data: GeneratedInvoice, filter: string) => {
      return (
        data.Chus_Name.toLocaleLowerCase().includes(
          filter.toLocaleLowerCase()
        ) ||
        data.Invoice_No.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
      );
    };
    this.tableDataService.setDataSourceFilterPredicate(filterPredicate);
  }
  private dataSourceSortingAccessor() {
    let sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
        case 'Due_Date':
          return new Date(item['Due_Date']);
        case 'Invoice_Expired_Date':
          return new Date(item['Invoice_Expired_Date']);
        default:
          return item[property];
      }
    };
    this.tableDataService.setDataSourceSortingDataAccessor(sortingDataAccessor);
  }
  private parseCreatedInvoiceDataListResponse(
    result: HttpDataResponse<number | GeneratedInvoice[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as GeneratedInvoice[]);
    }
  }
  private assignCreatedInvoiceDataList(
    result: HttpDataResponse<number | GeneratedInvoice[]>
  ) {
    this.parseCreatedInvoiceDataListResponse(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilterPredicate();
    this.dataSourceSortingAccessor();
    this.examineActivatedRoute(); //sorts viewed invoice
  }
  private requestCreatedInvoiceList() {
    this.tableLoading = true;
    this.invoiceService
      .getCreatedInvoiceList({ compid: this.getUserProfile().InstID })
      .then((result) => {
        this.assignCreatedInvoiceDataList(result);
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
        throw err;
      });
  }
  private prepareInvoiceFormGroup() {
    let form = this.fb.group({
      userid: this.fb.control(this.getUserProfile().Usno, [
        Validators.required,
      ]),
      compid: this.fb.control(this.getUserProfile().InstID.toString(), [
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
    formGroup.get('goods_status')?.setValue('Approved');
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
  private switchApproveInvoiceErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Invoice'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      default:
        return this.tr.translate('invoice.form.dialog.failedToApproveInvoice');
    }
  }
  private switchAddInvoiceErrorMessage(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Invoice'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      case 'Invoice Number is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.invoiceNo');
      case 'Invoice Date is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.invoiceDate');
      case 'Invoice Expiry Date is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.invoiceExpire');
      case 'Invoice Due Date is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.dueDate');
      case 'Payment Type is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.paymentType');
      case 'Customer Id is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.customer');
      case 'Invoice Details is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.customer');
      case 'Comp ID is missing'.toLocaleLowerCase():
        return this.tr.translate('invoice.form.dialog.customer');
      default:
        return this.tr.translate('invoice.form.dialog.failedToApproveInvoice');
    }
  }
  private parseAddInvoiceResponse(
    result: HttpDataResponse<number | GeneratedInvoice>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchAddInvoiceErrorMessage(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let msg = this.tr.translate(
        'invoice.form.dialog.invoiceApprovedSuccessfully'
      );
      AppUtilities.showSuccessMessage(
        msg,
        (e) => {},
        this.tr.translate('actions.ok')
      );
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex(
          (item) =>
            item.Inv_Mas_Sno ===
            (result.response as GeneratedInvoice).Inv_Mas_Sno
        );
      this.tableDataService.removedData(index);
    }
  }
  private requestAddInvoiceForm(value: AddInvoiceForm) {
    this.startLoading = true;
    this.invoiceService
      .addInvoice(value)
      .then((results) => {
        this.parseAddInvoiceResponse(results);
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
  private parseApproveInvoiceResponse(
    result: HttpDataResponse<number | GeneratedInvoice>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      let errorMessage = this.switchApproveInvoiceErrorMessage(
        result.message[0]
      );
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
      this.startLoading = false;
      this.cdr.detectChanges();
    } else {
      let formGroup = this.prepareInvoiceFormGroup();
      this.modifyInvoiceDetailsForm(
        formGroup,
        result.response as GeneratedInvoice,
        (result.response as GeneratedInvoice).details ?? []
      );
      this.requestAddInvoiceForm(formGroup.value as any);
    }
  }
  private requestApproveInvoice(invoice: GeneratedInvoice) {
    let compid = this.getUserProfile().InstID;
    let inv = invoice.Inv_Mas_Sno;
    this.startLoading = true;
    this.invoiceService
      .findInvoice({ compid: compid, inv: inv })
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
  private examineActivatedRoute() {
    this.activatedRoute.queryParams.subscribe({
      next: (params) => {
        try {
          if (params && params['invno']) {
            let invno = atob(params['invno']);
            this.tableSearch.setValue(invno);
          }
          this.cdr.detectChanges();
        } catch (err) {
          console.error(err);
        }
      },
    });
  }
  private invoiceStatusStyle(status: string) {
    if (status && status.toLocaleLowerCase() === 'active') {
      return 'invoice-active';
    } else if (status && status.toLocaleLowerCase() === 'overdue') {
      return 'invoice-overdue';
    } else if (status && status.toLocaleLowerCase() === 'expired') {
      return 'invoice-expired';
    } else return 'invoice-completed';
  }
  ngOnInit(): void {
    this.createTableHeadersFormGroup();
    this.requestCreatedInvoiceList();
    //this.examineActivatedRoute();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as VendorLoginResponse;
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(
          this.tableDataService.getData(),
          element
        );
      case 'Invoice_Date':
      case 'Due_Date':
      case 'Invoice_Expired_Date':
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
      case 'Status':
        return `${style} ${this.invoiceStatusStyle(element[key])}`;
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
      case 'Invoice_Expired_Date':
      case 'Due_Date':
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
        userProfile: this.getUserProfile(),
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
        userProfile: this.getUserProfile(),
      },
    });
  }
  //opens invoice details for editing
  openEditInvoiceDialog(generatedInvoice: GeneratedInvoice) {
    this.router.navigate(['/vendor/invoice/list/add'], {
      queryParams: { invno: btoa(generatedInvoice.Inv_Mas_Sno.toString()) },
    });
  }
  //saves a copy of an invoice to the local machine
  downloadInvoice(invoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(InvoiceDetailsViewComponent, {
      width: '800px',
      height: '800px',
      data: {
        Inv_Mas_Sno: invoice.Inv_Mas_Sno,
        userProfile: this.getUserProfile(),
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
  cancelInvoice(invoice: GeneratedInvoice) {
    // dialog.title = this.tr.translate(`defaults.warning`);
    // dialog.message = this.tr
    //   .translate(`invoice.createdInvoice.sureCancelInvoice`)
    //   .replace('{}', invoice.Invoice_No);
    // dialog.userId = this.getUserProfile().Usno;
    // dialog.invoiceId = invoice.Inv_Mas_Sno;
    // dialog.cancelledInvoice.asObservable().subscribe(() => {
    //   dialog.closeDialog();
    //   this.requestCreatedInvoiceList();
    // });
    // dialog.openDialog();
    let dialogRef = this.dialog.open(CancelGeneratedInvoiceComponent, {
      width: '800px',
      data: { invid: invoice.Inv_Mas_Sno },
    });
    dialogRef.componentInstance.cancelledInvoice
      .asObservable()
      .subscribe((invid) => {
        dialogRef.close();
        let index = this.tableDataService
          .getDataSource()
          .data.findIndex((item) => item.Inv_Mas_Sno === invid);
        this.tableDataService.removedData(index);
      });
  }
  //approve status
  approveInvoice(invoice: GeneratedInvoice, dialog: SubmitMessageBoxComponent) {
    dialog.title = this.tr.translate('defaults.confirm');
    dialog.message = this.tr
      .translate('invoice.createdInvoice.sureApproveInvoice')
      .replace('{}', invoice.Invoice_No);
    dialog.openDialog();
    dialog.confirm.asObservable().subscribe(() => {
      this.requestApproveInvoice(invoice);
      dialog.closeDialog();
    });
  }
  // determineApprovalStatus(status: string) {
  //   if (!status) {
  //     return '-';
  //   } else if (status.trim().toLocaleLowerCase() == '1') {
  //     return 'Approve';
  //   } else if (status.trim().toLocaleLowerCase() == '2') {
  //     return 'Done';
  //   }
  //   return '-';
  // }
  isApprovedInvoice(invoice: GeneratedInvoice) {
    return (
      this.getUserProfile()
        .Usno.toString()
        .localeCompare(invoice.AuditBy ?? '') !== 0
    );
  }
  getTableDataSource() {
    return this.tableDataService.getDataSource();
  }
  getTableDataList() {
    return this.tableDataService.getData();
  }
  getTableDataColumns() {
    return this.tableDataService.getTableColumns();
  }
  geTableDataColumnsObservable() {
    return this.tableDataService.getTableColumnsObservable();
  }
  get headers() {
    return this.tableHeadersFormGroup.get(`headers`) as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get('tableSearch') as FormControl;
  }
}
