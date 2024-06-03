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
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { LoginResponse } from 'src/app/core/models/login-response';

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
  public userProfile!: LoginResponse;
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
    branches: Branch[];
  } = {
    companies: [],
    customers: [],
    branches: [],
  };
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
    public branchService: BranchService,
    private reportsService: ReportsService,
    private fileHandler: FileHandlerService,
    private cdr: ChangeDetectorRef,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private createRequestFormGroup() {
    this.filterTableFormGroup = this.fb.group({
      compid: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.userProfile.braid, [Validators.required]),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    if (Number(this.userProfile.braid) > 0) {
      this.branch.disable();
    }
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
            this.filterFormData.customers = result.response;
            //this.customers = result.response;
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
            //this.customers = [];
            this.filterFormData.customers = [];
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
          //this.customers = [];
          this.filterFormData.customers = [];
          this.cusid.setValue('all');
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        });
    });
  }
  private sortTableAsc(ind: number): void {
    switch (ind) {
      case TransactionDetailsTableHeadersMap.PAYMENT_DATE:
        this.transactions.sort((a, b) =>
          new Date(a.Payment_Date) > new Date(b.Payment_Date) ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.INVOICE_NUMBER:
        this.transactions.sort((a, b) =>
          a.Invoice_Sno > b.Invoice_Sno ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.TOTAL_AMOUNT:
        this.transactions.sort((a, b) =>
          a.Requested_Amount > b.Requested_Amount ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.PAID_AMOUNT:
        this.transactions.sort((a, b) =>
          a.PaidAmount > b.PaidAmount ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.BALANCE:
        this.transactions.sort((a, b) => (a.Balance > b.Balance ? 1 : -1));
        break;
      case TransactionDetailsTableHeadersMap.CONTROL_NUMBER:
        this.transactions.sort((a, b) =>
          a.Control_No > b.Control_No ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.PAYMENT_TYPE:
        this.transactions.sort((a, b) =>
          a.Payment_Type > b.Payment_Type ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.PAYMENT_METHOD:
        this.transactions.sort((a, b) =>
          a.Trans_Channel > b.Trans_Channel ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.TRANSACTION_NUMBER:
        this.transactions.sort((a, b) =>
          a.Payment_Trans_No > b.Payment_Trans_No ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.RECEIPT_NUMBER:
        this.transactions.sort((a, b) =>
          a.Receipt_No > b.Receipt_No ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number): void {
    switch (ind) {
      case TransactionDetailsTableHeadersMap.PAYMENT_DATE:
        this.transactions.sort((a, b) =>
          new Date(a.Payment_Date) < new Date(b.Payment_Date) ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.INVOICE_NUMBER:
        this.transactions.sort((a, b) =>
          a.Invoice_Sno < b.Invoice_Sno ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.TOTAL_AMOUNT:
        this.transactions.sort((a, b) =>
          a.Requested_Amount < b.Requested_Amount ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.PAID_AMOUNT:
        this.transactions.sort((a, b) =>
          a.PaidAmount < b.PaidAmount ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.BALANCE:
        this.transactions.sort((a, b) => (a.Balance < b.Balance ? 1 : -1));
        break;
      case TransactionDetailsTableHeadersMap.CONTROL_NUMBER:
        this.transactions.sort((a, b) =>
          a.Control_No < b.Control_No ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.PAYMENT_TYPE:
        this.transactions.sort((a, b) =>
          a.Payment_Type < b.Payment_Type ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.PAYMENT_METHOD:
        this.transactions.sort((a, b) =>
          a.Trans_Channel < b.Trans_Channel ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.TRANSACTION_NUMBER:
        this.transactions.sort((a, b) =>
          a.Payment_Trans_No < b.Payment_Trans_No ? 1 : -1
        );
        break;
      case TransactionDetailsTableHeadersMap.RECEIPT_NUMBER:
        this.transactions.sort((a, b) =>
          a.Receipt_No < b.Receipt_No ? 1 : -1
        );
        break;
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
    let branchObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(companiesObs, branchObs));
    res
      .then((results) => {
        let [companiesList, branchList] = results;
        if (
          typeof companiesList.response !== 'number' &&
          typeof companiesList.response !== 'string'
        ) {
          this.filterFormData.companies = companiesList.response as Company[];
        }
        if (
          typeof branchList.response !== 'number' &&
          typeof branchList.response !== 'string'
        ) {
          this.filterFormData.branches = branchList.response;
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
        this.filterFormData.companies = [];
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
  private transactionKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAYMENT_DATE)) {
      keys.push('Payment_Date');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.INVOICE_NUMBER)) {
      keys.push('Invoice_Sno');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.TOTAL_AMOUNT)) {
      keys.push('Requested_Amount');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAID_AMOUNT)) {
      keys.push('PaidAmount');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.BALANCE)) {
      keys.push('Balance');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.PAYMENT_METHOD)) {
      keys.push('Trans_Channel');
    }
    if (
      indexes.includes(TransactionDetailsTableHeadersMap.TRANSACTION_NUMBER)
    ) {
      keys.push('Payment_Trans_No');
    }
    if (indexes.includes(TransactionDetailsTableHeadersMap.RECEIPT_NUMBER)) {
      keys.push('Receipt_No');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.transactionKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.trim().toLowerCase();
      let keys = this.getActiveTableKeys();
      this.transactions = this.transactionsData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.transactions = this.transactionsData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
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
  }
  downloadSheet() {
    if (this.transactionsData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.transactionsData,
        this.getActiveTableKeys(),
        'transaction_details_report',
        ['Payment_Date']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
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
      let form = { ...this.filterTableFormGroup.value };
      if (form.stdate) {
        form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
      }
      if (form.enddate) {
        form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
      }
      form.branch = this.branch.value;
      this.requestTransactionDetailsList(form);
    } else {
      this.filterTableFormGroup.markAllAsTouched();
    }
  }
  isCashAmountColumn(index: number) {
    return (
      index === TransactionDetailsTableHeadersMap.TOTAL_AMOUNT ||
      index === TransactionDetailsTableHeadersMap.PAID_AMOUNT ||
      index === TransactionDetailsTableHeadersMap.BALANCE
    );
  }
  invoiceNumberToBase64(invoice_number: string) {
    return btoa(invoice_number);
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
  get branch() {
    return this.filterTableFormGroup.get(`branch`) as FormControl;
  }
  get enddate() {
    return this.filterTableFormGroup.get(`enddate`) as FormControl;
  }
}
