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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
import { RefundInvoiceComponent } from 'src/app/components/dialogs/Vendors/refund-invoice/refund-invoice.component';
import { Observable, map, of } from 'rxjs';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { TableColumnsData } from 'src/app/core/models/table-columns-data';
import * as json from 'src/assets/temp/data.json';

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
    MatTableModule,
    MatSortModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneratedInvoiceListComponent implements OnInit {
  public userProfile!: LoginResponse;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public generatedInvoices: GeneratedInvoice[] = [];
  public generatedInvoicesData: GeneratedInvoice[] = [];
  public tableHeadersFormGroup!: FormGroup;
  private originalTableColumns: TableColumnsData[] = [];
  public tableColumns: TableColumnsData[] = [];
  public tableColumns$!: Observable<TableColumnsData[]>;
  public dataSource!: MatTableDataSource<GeneratedInvoice>;
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
    let TABLE_SHOWING = 7;
    this.tableHeadersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    this.tr
      .selectTranslate(`generatedInvoicesTable`, {}, this.scope)
      .subscribe((labels: TableColumnsData[]) => {
        this.originalTableColumns = labels;
        this.originalTableColumns.forEach((column, index) => {
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
    this.tableColumns = this.headers.controls
      .filter((header) => header.get('included')?.value)
      .map((header) => {
        return {
          label: header.get('label')?.value,
          value: header.get('value')?.value,
          desc: header.get('desc')?.value,
        } as TableColumnsData;
      });
    this.tableColumns$ = of(this.tableColumns);
  }
  private dataSourceFilter() {
    this.dataSource.filterPredicate = (
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
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'Invoice_Date':
          return new Date(item['Invoice_Date']);
        default:
          return item[property];
      }
    };
  }
  private prepareDataSource() {
    this.dataSource = new MatTableDataSource<GeneratedInvoice>(
      this.generatedInvoices
    );
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSourceFilter();
    this.dataSourceSortingAccessor();
  }
  private emptyGeneratedInvoice() {
    this.generatedInvoicesData = [];
    this.generatedInvoices = this.generatedInvoicesData;
  }
  private requestGeneratedInvoice() {
    this.emptyGeneratedInvoice();
    this.tableLoading = true;
    this.invoiceService
      .postSignedDetails({ compid: this.userProfile.InstID })
      .then((result) => {
        if (
          typeof result.response !== 'string' &&
          typeof result.response !== 'number'
        ) {
          this.generatedInvoices = result.response;
          this.prepareDataSource();
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
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
  //action to filter table by search key up
  private searchTable(searchText: string, paginator: MatPaginator) {
    this.dataSource.filter = searchText.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createHeadersForm();
    this.requestGeneratedInvoice();
  }
  tableHeader(columns: TableColumnsData[]) {
    return columns.map((col) => col.label);
  }
  tableValue(element: any, key: string) {
    switch (key) {
      case 'No.':
        return PerformanceUtils.getIndexOfItem(this.generatedInvoices, element);
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
      case 'Control_No':
        return element['Control_No'] ? element['Control_No'] : '-';
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
