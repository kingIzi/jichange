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
  ViewEncapsulation,
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
import { ActivatedRoute, RouterModule } from '@angular/router';
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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { InvoiceService } from 'src/app/core/services/vendor/invoice.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { CancelGeneratedInvoiceComponent } from 'src/app/components/dialogs/Vendors/cancel-generated-invoice/cancel-generated-invoice.component';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { GeneratedInvoiceListTable } from 'src/app/core/enums/vendor/invoices/generated-invoice-list-table';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { AmendmentDetailsDialogComponent } from 'src/app/components/dialogs/Vendors/amendment-details-dialog/amendment-details-dialog.component';
import { RefundInvoiceComponent } from 'src/app/components/dialogs/Vendors/refund-invoice/refund-invoice.component';
import { Observable, map, of } from 'rxjs';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import * as json from 'src/assets/temp/data.json';
import { SubmitMessageBoxComponent } from 'src/app/components/dialogs/submit-message-box/submit-message-box.component';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  listAnimationMobile,
  listAnimationDesktop,
  inOutAnimation,
} from 'src/app/components/layouts/main/router-transition-animations';
import { TableDataService } from 'src/app/core/services/table-data.service';
import { VENDOR_TABLE_DATA_SERVICE } from 'src/app/core/tokens/tokens';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { VendorLoginResponse } from 'src/app/core/models/login-response';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-generated-invoice-list',
  templateUrl: './generated-invoice-list.component.html',
  styleUrls: ['./generated-invoice-list.component.scss'],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/generated', alias: 'generated' },
    },
    {
      provide: VENDOR_TABLE_DATA_SERVICE,
      useClass: TableDataService,
    },
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
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
    MatTableModule,
    MatSortModule,
    SubmitMessageBoxComponent,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [listAnimationMobile, listAnimationDesktop, inOutAnimation],
})
export class GeneratedInvoiceListComponent implements OnInit {
  //public userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public tableHeadersFormGroup!: FormGroup;
  // public tableData: {
  //   generatedInvoices: GeneratedInvoice[];
  //   originalTableColumns: TableColumnsData[];
  //   tableColumns: TableColumnsData[];
  //   tableColumns$: Observable<TableColumnsData[]>;
  //   dataSource: MatTableDataSource<GeneratedInvoice>;
  // } = {
  //   generatedInvoices: [],
  //   originalTableColumns: [],
  //   tableColumns: [],
  //   tableColumns$: of([]),
  //   dataSource: new MatTableDataSource<GeneratedInvoice>([]),
  // };
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @ViewChild('generatedInvoiceTable', { static: true })
  generatedInvoiceTable!: ElementRef<HTMLTableElement>;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private appConfig: AppConfigService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private tr: TranslocoService,
    private fb: FormBuilder,
    private fileHandler: FileHandlerService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    @Inject(VENDOR_TABLE_DATA_SERVICE)
    private tableDataService: TableDataService<GeneratedInvoice>,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  //create formGroup for each header item in table
  private createHeadersForm() {
    let TABLE_SHOWING = 9;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`generatedInvoicesTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        //this.tableData.originalTableColumns = labels;
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
    //this.tableData.tableColumns$ = of(this.tableData.tableColumns);
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
  // private prepareDataSource() {
  //   this.tableData.dataSource = new MatTableDataSource<GeneratedInvoice>(
  //     this.tableData.generatedInvoices
  //   );
  //   this.tableData.dataSource.paginator = this.paginator;
  //   this.tableData.dataSource.sort = this.sort;
  //   this.dataSourceFilter();
  //   this.dataSourceSortingAccessor();
  // }
  private parseGeneratedInvoiceResponse(
    result: HttpDataResponse<number | GeneratedInvoice[]>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors) {
      this.tableDataService.setData([]);
    } else {
      this.tableDataService.setData(result.response as GeneratedInvoice[]);
    }
  }
  private assignGeneratedInvoiceDataList(
    result: HttpDataResponse<number | GeneratedInvoice[]>
  ) {
    this.parseGeneratedInvoiceResponse(result);
    this.tableDataService.prepareDataSource(this.paginator, this.sort);
    this.dataSourceFilterPredicate();
    this.dataSourceSortingAccessor();
    this.examineActivatedRoute();
  }
  private requestGeneratedInvoice() {
    this.tableLoading = true;
    this.invoiceService
      .postSignedDetails({ compid: this.getUserProfile().InstID })
      .then((result) => {
        this.assignGeneratedInvoiceDataList(result);
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
  private switchSendInvoiceDeliveryCode(message: string) {
    let errorMessage = AppUtilities.switchGenericSetupErrorMessage(
      message,
      this.tr,
      'Invoice'
    );
    if (errorMessage.length > 0) return errorMessage;
    switch (message.toLocaleLowerCase()) {
      default:
        return this.tr.translate(`generated.deliver.failedToSendDeliveryCode`);
    }
  }
  private parseSendInvoiceDeliveryCodeResponse(
    result: HttpDataResponse<number | GeneratedInvoice>
  ) {
    let hasErrors = AppUtilities.hasErrorResult(result);
    if (hasErrors || !result.response) {
      let errorMessage = this.switchSendInvoiceDeliveryCode(result.message[0]);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        errorMessage
      );
    } else {
      let msg = this.tr.translate(
        `generated.deliver.deliveryCodeSentSuccessfully`
      );
      AppUtilities.showSuccessMessage(
        msg,
        (e) => {},
        this.tr.translate(`actions.ok`)
      );
      let invoice = result.response as GeneratedInvoice;
      let index = this.tableDataService
        .getDataSource()
        .data.findIndex((item) => item.Inv_Mas_Sno === invoice.Inv_Mas_Sno);
      this.tableDataService.editedData(invoice, index);
      this.tableSearch.setValue(invoice.Invoice_No);
    }
  }
  //send delivery code to customer
  private requestSendAddDeliveryCode(body: {
    sno: number | string;
    user_id: number | string;
  }) {
    this.startLoading = true;
    this.invoiceService
      .addDeliveryCode(body)
      .then((result) => {
        this.parseSendInvoiceDeliveryCodeResponse(result);
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
  private deliveryStatusStyle(deliveryStatus?: string) {
    if (deliveryStatus) {
      return `${PerformanceUtils.getActiveStatusStyles(
        deliveryStatus,
        'Delivered',
        'bg-green-100',
        'text-green-700',
        'bg-orange-100',
        'text-orange-700'
      )} text-center w-fit`;
    } else {
      return 'delivery-status';
    }
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
  ngOnInit(): void {
    this.createHeadersForm();
    this.requestGeneratedInvoice();
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
      case 'Control_No':
        return element['Control_No'] ? element['Control_No'] : '-';
      case 'delivery_status':
        return element[key] ?? 'Unsent';
      default:
        return element[key];
    }
  }
  tableValueStyle(element: any, key: string) {
    let style = 'text-xs lg:text-sm leading-relaxed';
    switch (key) {
      case 'Invoice_No':
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
      case 'delivery_status':
        return `${style} ${this.deliveryStatusStyle(element[key])}`;
      case 'Status':
        return `${style} ${this.invoiceStatusStyle(element[key])}`;
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
      case 'Control_No':
      case 'Invoice_Date':
      case 'goods_status':
      case 'Invoice_Expired_Date':
      case 'Due_Date':
      case 'Status':
        return column.value;
      default:
        return '';
    }
  }
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  //opens generate chart dialog
  openGeneratedInvoiceChart() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: GeneratedInvoiceListTable,
        headers: this.headers.controls.map((c) => c.get('label')?.value),
        generatedInvoices: this.tableDataService.getData(),
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
        userProfile: this.getUserProfile(),
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
        userProfile: this.getUserProfile(),
      },
    });
    dialogRef.componentInstance.viewReady.asObservable().subscribe((view) => {
      this.fileHandler
        .downloadPdf(view, `invoice-${generatedInvoice.Invoice_No}.pdf`)
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
      let msg = this.tr.translate('generated.addedInvoiceSuccessfully');
      AppUtilities.showSuccessMessage(
        msg,
        (e) => {},
        this.tr.translate(`actions.ok`)
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
    dialogRef.componentInstance.amended.asObservable().subscribe((invoice) => {
      dialogRef.close();
      let message = this.tr.translate(`generated.invoiceAmendedSuccessfully`);
      AppUtilities.showSuccessMessage(
        message,
        //AppUtilities.redirectPage(path, queryParams, this.router),
        () => {},
        this.tr.translate('actions.ok')
      );

      this.tableLoading = true;
      let res = this.invoiceService.signedDetailsList({
        compid: this.getUserProfile().InstID,
      });
      res.subscribe({
        next: (result) => {
          this.assignGeneratedInvoiceDataList(result);
          this.tableSearch.setValue(invoice.Invoice_No);
          this.tableLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          AppUtilities.requestFailedCatchError(
            err,
            this.displayMessageBox,
            this.tr
          );
          this.tableLoading = false;
          this.cdr.detectChanges();
          throw err;
        },
      });
    });
  }
  makeInvoiceDelivery(
    messageBox: SubmitMessageBoxComponent,
    invoice: GeneratedInvoice
  ) {
    messageBox.title = this.tr.translate(`generated.deliver.markDeliver`);
    messageBox.message = this.tr
      .translate(`generated.deliver.sureDeliver`)
      .replace('{}', invoice.Invoice_No);
    messageBox.openDialog();
    messageBox.confirm.asObservable().subscribe(() => {
      let body = {
        sno: invoice.Inv_Mas_Sno,
        user_id: this.getUserProfile().Usno,
      };
      this.requestSendAddDeliveryCode(body);
    });
  }
  openRefundInvoiceDialog(invoice: GeneratedInvoice) {
    let dialogRef = this.dialog.open(RefundInvoiceComponent, {
      width: '500px',
      disableClose: true,
      data: {
        invid: invoice.Inv_Mas_Sno,
      },
    });
  }
  getActiveStatusStyles(status: string) {
    return status
      ? status.toLocaleLowerCase() === 'active'
        ? 'bg-green-100 text-green-600 px-4 py-1 rounded-lg shadow'
        : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow'
      : 'bg-orange-100 text-orange-600 px-4 py-1 rounded-lg shadow';
  }
  cancelInvoice(invoice: GeneratedInvoice) {
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
    return this.tableHeadersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.tableHeadersFormGroup.get(`tableSearch`) as FormControl;
  }
}
