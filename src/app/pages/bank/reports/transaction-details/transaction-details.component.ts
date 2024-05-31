import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
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
import { Router, RouterModule } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { RemoveItemDialogComponent } from 'src/app/components/dialogs/Vendors/remove-item-dialog/remove-item-dialog.component';
import { TransactionDetailsEditComponent } from 'src/app/components/dialogs/bank/reports/transaction-details-edit/transaction-details-edit.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { TransactionDetailsTableHeadersMap } from 'src/app/core/enums/bank/reports/transaction-details-table-headers-map';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
//import * as json from 'src/assets/temp/data.json';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { from, zip } from 'rxjs';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TransactionDetailsReportForm } from 'src/app/core/models/bank/forms/reports/transaction-details-report-form';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';

@Component({
  selector: 'app-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RemoveItemDialogComponent,
    TableDateFiltersComponent,
    SuccessMessageBoxComponent,
    ReactiveFormsModule,
    TranslocoModule,
    MatDialogModule,
    RouterModule,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class TransactionDetailsComponent implements OnInit {
  public headersFormGroup!: FormGroup;
  public filterTableFormGroup!: FormGroup;
  public tableLoading: boolean = false;
  public startLoading: boolean = false;
  public includedHeaders: any[] = [];
  public transactions: TransactionDetail[] = [];
  public transactionsData: TransactionDetail[] = [];
  public companies: Company[] = [];
  public customers: Customer[] = [];
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public TransactionDetailsTableHeadersMap: typeof TransactionDetailsTableHeadersMap =
    TransactionDetailsTableHeadersMap;

  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private tr: TranslocoService,
    private router: Router,
    private reportsService: ReportsService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private createRequestFormGroup() {
    this.filterTableFormGroup = this.fb.group({
      compid: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    this.companyChangedEventHandler();
  }
  private companyChangedEventHandler() {
    this.startLoading = true;
    this.compid.valueChanges.subscribe((value) => {
      this.startLoading = true;
      let companyList = this.reportsService.getCustomerDetailsList({
        Sno: value,
      });
      companyList
        .then((result) => {
          if (
            typeof result.response !== 'number' &&
            typeof result.response !== 'string'
          ) {
            this.customers = result.response;
          } else {
            if (this.compid.value !== 'all') {
              AppUtilities.openDisplayMessageBox(
                this.displayMessageBox,
                this.tr.translate(`defaults.failed`),
                this.tr.translate(
                  `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
                )
              );
            }
            this.customers = [];
            this.cusid.setValue('all');
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
          this.customers = [];
          this.cusid.setValue('all');
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        });
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      // case this.headersMap.DATE:
      //   this.transactions.sort((a, b) => (a.date > b.date ? 1 : -1));
      //   break;
      // case this.headersMap.COMPANY:
      //   this.transactions.sort((a, b) => (a.company > b.company ? 1 : -1));
      //   break;
      // case this.headersMap.DESCRIPTION:
      //   this.transactions.sort((a, b) =>
      //     a.description > b.description ? 1 : -1
      //   );
      //   break;
      // case this.headersMap.AMOUNT:
      //   this.transactions.sort((a, b) => (a.amount > b.amount ? 1 : -1));
      //   break;
      // case this.headersMap.STATUS:
      //   this.transactions.sort((a, b) => (a.status > b.status ? 1 : -1));
      //   break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      // case this.headersMap.DATE:
      //   this.transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
      //   break;
      // case this.headersMap.COMPANY:
      //   this.transactions.sort((a, b) => (a.company < b.company ? 1 : -1));
      //   break;
      // case this.headersMap.DESCRIPTION:
      //   this.transactions.sort((a, b) =>
      //     a.description < b.description ? 1 : -1
      //   );
      //   break;
      // case this.headersMap.AMOUNT:
      //   this.transactions.sort((a, b) => (a.amount < b.amount ? 1 : -1));
      //   break;
      // case this.headersMap.STATUS:
      //   this.transactions.sort((a, b) => (a.status < b.status ? 1 : -1));
      //   break;
      default:
        break;
    }
  }
  private createHeadersFormGroup() {
    this.headersFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `transactionDetails.transactionDetailsTable`,
      this.scope,
      this.headers,
      this.fb,
      this,
      7,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(this.reportsService.getCompaniesList({}));
    let res = AppUtilities.pipedObservables(zip(companiesObs));
    res
      .then((results) => {
        let [companiesList] = results;
        if (typeof companiesList.response !== 'number') {
          this.companies = companiesList.response as Company[];
          this.startLoading = false;
        } else {
          this.companies = [];
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
  private requestTransactionDetailsList(form: TransactionDetailsReportForm) {
    this.tableLoading = true;
    this.reportsService
      .getTransactionsReport(form)
      .then((result) => {
        if (
          typeof result.response !== 'number' &&
          typeof result.response !== 'string'
        ) {
          this.transactionsData = result.response;
          this.transactions = this.transactionsData;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.transactionsData = [];
          this.transactions = this.transactionsData;
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
        throw err;
      });
  }
  ngOnInit(): void {
    this.createHeadersFormGroup();
    this.createRequestFormGroup();
    this.buildPage();
  }
  //returns true if column index as cash amount as values
  indexIncludedHeader(control: AbstractControl<any, any>) {
    let amountIndexes = [4];
    let found = this.includedHeaders.findIndex((group) => {
      return control === group;
    });
    if (found !== -1) {
      return amountIndexes.includes(found);
    }
    return false;
  }
  //open transaction chart
  openTransactionCharts() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        //headersMap: this.headersMap,
        headers: this.headers.controls.map((c) => c.get('label')?.value),
        transactions: this.transactions,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
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
    return new Date(timestamp);
  }
  downloadSheet() {
    // let data = this.transactionsData.map((d) => {
    //   let t = { ...d };
    //   t.date = AppUtilities.convertDotNetJsonDateToDate(
    //     d.date
    //   ).toLocaleString();
    //   return t;
    // });
    // this.fileHandler.exportAsExcelFile(data, 'transaction_details');
  }
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
  getValueArray(ind: number) {
    return this.headers.controls.at(ind)?.get('values') as FormArray;
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  downloadPdf(ind: number, route: string) {
    this.router.navigate([route], { queryParams: { download: true } });
  }
  removeItem(ind: number, dialog: RemoveItemDialogComponent) {
    dialog.title = 'Remove transaction';
    dialog.message =
      'Are you sure you want to remove this transaction permanently?';
    dialog.openDialog();
    dialog.remove.asObservable().subscribe(() => {
      this.transactions.splice(ind, 1);
    });
  }
  submitForm() {
    if (this.filterTableFormGroup.valid) {
      this.requestTransactionDetailsList(this.filterTableFormGroup.value);
    } else {
      this.filterTableFormGroup.markAllAsTouched();
    }
  }
  invoiceNumberToBase64(invoice_number: string) {
    return btoa(invoice_number);
  }
  searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      this.transactions = this.transactionsData.filter((elem: any) => {
        return (
          elem.company
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase()) ||
          elem.description
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase()) ||
          elem.transactionNumber
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase()) ||
          elem.status
            .toLocaleLowerCase()
            .includes(searchText.toLocaleLowerCase())
        );
      });
    } else {
      this.transactions = this.transactionsData;
    }
  }
  get headers() {
    return this.headersFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headersFormGroup.get('tableSearch') as FormControl;
  }
  get compid() {
    return this.filterTableFormGroup.get(`compid`) as FormControl;
  }
  get cusid() {
    return this.filterTableFormGroup.get(`cusid`) as FormControl;
  }
  get stdate() {
    return this.filterTableFormGroup.get(`stdate`) as FormControl;
  }
  get enddate() {
    return this.filterTableFormGroup.get(`enddate`) as FormControl;
  }
}
