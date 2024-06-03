import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  NO_ERRORS_SCHEMA,
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
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { NgxLoadingModule } from 'ngx-loading';
import { firstValueFrom, from, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { SuccessMessageBoxComponent } from 'src/app/components/dialogs/success-message-box/success-message-box.component';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { PaymentDetailsTable } from 'src/app/core/enums/bank/reports/payment-details-table';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { PaymentDetail } from 'src/app/core/models/vendors/payment-detail';
import { PaymentDetailReportForm } from 'src/app/core/models/vendors/forms/payment-report-form';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { LoginResponse } from 'src/app/core/models/login-response';

@Component({
  selector: 'app-payment-details',
  standalone: true,
  imports: [
    SuccessMessageBoxComponent,
    TranslocoModule,
    CommonModule,
    ReactiveFormsModule,
    DisplayMessageBoxComponent,
    MatPaginatorModule,
    LoaderInfiniteSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-details.component.html',
  styleUrl: './payment-details.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class PaymentDetailsComponent implements OnInit {
  //public companies: Company[] = [];
  //public customers: Customer[] = [];
  //public invoiceReports: InvoiceReport[] = [];
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
    invoiceReports: InvoiceReport[];
    branches: Branch[];
  } = {
    companies: [],
    customers: [],
    invoiceReports: [],
    branches: [],
  };
  public payments: PaymentDetail[] = [];
  public paymentsData: PaymentDetail[] = [];
  public filterForm!: FormGroup;
  public tableFormGroup!: FormGroup;
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public PaymentDetailsTable: typeof PaymentDetailsTable = PaymentDetailsTable;
  @ViewChild('successMessageBox')
  successMessageBox!: SuccessMessageBoxComponent;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private fb: FormBuilder,
    private tr: TranslocoService,
    private branchService: BranchService,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private paymentService: PaymentsService,
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
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.compid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.company`)
      );
    }
    if (this.cusid.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.customer`)
      );
    }
    if (this.stdate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.startDate`)
      );
    }
    if (this.enddate.invalid) {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`${errorsPath}.invalidForm`),
        this.tr.translate(`${errorsPath}.endDate`)
      );
    }
  }
  private createFilterForm() {
    this.filterForm = this.fb.group({
      compid: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.userProfile.braid, [Validators.required]),
      invno: this.fb.control('', []),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
    });
    if (Number(this.userProfile.braid) > 0) {
      this.branch.disable();
    }
    this.companyChangedEventHandler();
    this.filterFormChanged();
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
          this.filterFormData.customers = [];
          this.cusid.setValue('all');
          this.startLoading = false;
          this.cdr.detectChanges();
          throw err;
        });
    });
  }
  private filterFormChanged() {
    this.startLoading = true;
    this.filterForm.valueChanges.subscribe((value) => {
      if (value.compid && value.cusid) {
        let form = {
          Comp: value.compid,
          cusid: value.cusid,
          stdate: '',
          enddate: '',
        } as InvoiceReportForm;
        this.invoiceReportService
          .getInvoiceReport(form)
          .then((result) => {
            if (
              result.response &&
              typeof result.response !== 'number' &&
              result.response !== 'string'
            ) {
              this.filterFormData.invoiceReports =
                result.response as InvoiceReport[];
            } else {
              this.filterFormData.invoiceReports = [];
            }
            this.tableLoading = false;
            this.cdr.detectChanges();
          })
          .catch((err) => {
            this.filterFormData.invoiceReports = [];
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
    });
  }
  private async createHeaderGroup() {
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `paymentDetails.paymentsTable`,
      this.scope,
      this.tableHeaders,
      this.fb,
      this,
      7,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case PaymentDetailsTable.PAYMENT_DATE:
        this.payments.sort((a, b) =>
          new Date(a.Payment_Date) > new Date(b.Payment_Date) ? 1 : -1
        );
        break;
      case PaymentDetailsTable.INVOICE_NUMBER:
        this.payments.sort((a, b) => (a.Invoice_Sno > b.Invoice_Sno ? 1 : -1));
        break;
      case PaymentDetailsTable.TRANSACTION_NUMBER:
        this.payments.sort((a, b) =>
          a.Payment_Trans_No > b.Payment_Trans_No ? 1 : -1
        );
        break;
      case PaymentDetailsTable.CONTROL_NUMBER:
        this.payments.sort((a, b) => (a.Control_No > b.Control_No ? 1 : -1));
        break;
      case PaymentDetailsTable.CHANNEL:
        this.payments.sort((a, b) =>
          a.Trans_Channel > b.Trans_Channel ? 1 : -1
        );
        break;
      case PaymentDetailsTable.CHANNEL:
        this.payments.sort((a, b) =>
          a.Trans_Channel > b.Trans_Channel ? 1 : -1
        );
        break;
      case PaymentDetailsTable.RECEIPT_NUMBER:
        this.payments.sort((a, b) => (a.Receipt_No > b.Receipt_No ? 1 : -1));
        break;
      case PaymentDetailsTable.AMOUNT:
        this.payments.sort((a, b) => (a.PaidAmount > b.PaidAmount ? 1 : -1));
        break;
      case PaymentDetailsTable.BALANCE:
        this.payments.sort((a, b) => (a.Balance > b.Balance ? 1 : -1));
        break;
      case PaymentDetailsTable.FROM:
        this.payments.sort((a, b) => (a.Payer_Name > b.Payer_Name ? 1 : -1));
        break;
      case PaymentDetailsTable.TO:
        this.payments.sort((a, b) =>
          a.Customer_Name > b.Customer_Name ? 1 : -1
        );
        break;
      case PaymentDetailsTable.FOR:
        this.payments.sort((a, b) =>
          (a.Payment_Desc || '') > (b.Payment_Desc || '') ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case PaymentDetailsTable.PAYMENT_DATE:
        this.payments.sort((a, b) =>
          new Date(a.Payment_Date) < new Date(b.Payment_Date) ? 1 : -1
        );
        break;
      case PaymentDetailsTable.INVOICE_NUMBER:
        this.payments.sort((a, b) => (a.Invoice_Sno < b.Invoice_Sno ? 1 : -1));
        break;
      case PaymentDetailsTable.TRANSACTION_NUMBER:
        this.payments.sort((a, b) =>
          a.Payment_Trans_No < b.Payment_Trans_No ? 1 : -1
        );
        break;
      case PaymentDetailsTable.CONTROL_NUMBER:
        this.payments.sort((a, b) => (a.Control_No < b.Control_No ? 1 : -1));
        break;
      case PaymentDetailsTable.CHANNEL:
        this.payments.sort((a, b) =>
          a.Trans_Channel < b.Trans_Channel ? 1 : -1
        );
        break;
      case PaymentDetailsTable.CHANNEL:
        this.payments.sort((a, b) =>
          a.Trans_Channel < b.Trans_Channel ? 1 : -1
        );
        break;
      case PaymentDetailsTable.RECEIPT_NUMBER:
        this.payments.sort((a, b) => (a.Receipt_No < b.Receipt_No ? 1 : -1));
        break;
      case PaymentDetailsTable.AMOUNT:
        this.payments.sort((a, b) => (a.PaidAmount < b.PaidAmount ? 1 : -1));
        break;
      case PaymentDetailsTable.BALANCE:
        this.payments.sort((a, b) => (a.Balance < b.Balance ? 1 : -1));
        break;
      case PaymentDetailsTable.FROM:
        this.payments.sort((a, b) => (a.Payer_Name < b.Payer_Name ? 1 : -1));
        break;
      case PaymentDetailsTable.TO:
        this.payments.sort((a, b) =>
          a.Customer_Name < b.Customer_Name ? 1 : -1
        );
        break;
      case PaymentDetailsTable.FOR:
        this.payments.sort((a, b) =>
          (a.Payment_Desc || '') < (b.Payment_Desc || '') ? 1 : -1
        );
        break;
      default:
        break;
    }
  }
  private paymentKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(PaymentDetailsTable.PAYMENT_DATE)) {
      keys.push('Payment_Date');
    }
    if (indexes.includes(PaymentDetailsTable.INVOICE_NUMBER)) {
      keys.push('Invoice_Sno');
    }
    if (indexes.includes(PaymentDetailsTable.TRANSACTION_NUMBER)) {
      keys.push('Payment_Trans_No');
    }
    if (indexes.includes(PaymentDetailsTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(PaymentDetailsTable.CHANNEL)) {
      keys.push('Trans_Channel');
    }
    if (indexes.includes(PaymentDetailsTable.RECEIPT_NUMBER)) {
      keys.push('Receipt_No');
    }
    if (indexes.includes(PaymentDetailsTable.AMOUNT)) {
      keys.push('PaidAmount');
    }
    if (indexes.includes(PaymentDetailsTable.BALANCE)) {
      keys.push('Balance');
    }
    if (indexes.includes(PaymentDetailsTable.FROM)) {
      keys.push('Payer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.TO)) {
      keys.push('Customer_Name');
    }
    if (indexes.includes(PaymentDetailsTable.FOR)) {
      keys.push('Payment_Desc');
    }
    return keys;
  }
  private getActiveTableKeys() {
    let indexes = this.tableHeaders.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.paymentKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.trim().toLowerCase();
      let keys = this.getActiveTableKeys();
      this.payments = this.payments.filter((payment: any) => {
        return keys.some((key) => payment[key]?.toLowerCase().includes(text));
      });
    } else {
      this.payments = this.paymentsData;
    }
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(this.reportsService.getCompaniesList({}));
    let branchObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(companiesObs, branchObs));
    res
      .then((results) => {
        let [companies, branchList] = results;
        if (
          typeof companies.response !== 'number' &&
          typeof companies.response !== 'string'
        ) {
          this.filterFormData.companies = companies.response as Company[];
          this.startLoading = false;
        }
        if (
          typeof branchList.response !== 'number' &&
          typeof branchList.response !== 'string'
        ) {
          this.filterFormData.branches = branchList.response as Branch[];
          this.startLoading = false;
        }
        // else {
        //   this.filterFormData.companies = [];
        // }
        this.startLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.filterFormData.companies = [];
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
  private requestPaymentReport(value: PaymentDetailReportForm) {
    this.tableLoading = true;
    this.paymentService
      .getPaymentReport(value)
      .then((results) => {
        console.log(results);
        if (
          typeof results.response !== 'number' &&
          typeof results.response !== 'string'
        ) {
          this.paymentsData = results.response;
          this.payments = this.paymentsData;
        } else {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
          this.paymentsData = [];
          this.payments = this.paymentsData;
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
    this.parseUserProfile();
    this.createFilterForm();
    this.createHeaderGroup();
    this.buildPage();
  }
  submitFilterForm() {
    if (this.filterForm.valid) {
      let form = { ...this.filterForm.value };
      if (form.stdate) {
        form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
      }
      if (form.enddate) {
        form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
      }
      form.branch = this.branch.value;
      this.requestPaymentReport(form);
    } else {
      this.filterForm.markAllAsTouched();
    }
  }
  isCashAmountColumn(index: number) {
    return (
      index == PaymentDetailsTable.AMOUNT ||
      index == PaymentDetailsTable.BALANCE
    );
  }
  downloadSheet() {
    if (this.paymentsData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.paymentsData,
        this.getActiveTableKeys(),
        'payment_details_report',
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
  get compid() {
    return this.filterForm.get('compid') as FormControl;
  }
  get cusid() {
    return this.filterForm.get('cusid') as FormControl;
  }
  get invno() {
    return this.filterForm.get('invno') as FormControl;
  }
  get branch() {
    return this.filterForm.get('branch') as FormControl;
  }
  get stdate() {
    return this.filterForm.get('stdate') as FormControl;
  }
  get enddate() {
    return this.filterForm.get('enddate') as FormControl;
  }
  get tableHeaders() {
    return this.tableFormGroup.get('tableHeaders') as FormArray;
  }
  get tableSearch() {
    return this.tableFormGroup.get('tableSearch') as FormControl;
  }
}
