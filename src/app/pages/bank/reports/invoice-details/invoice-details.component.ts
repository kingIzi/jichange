import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { TableDateFiltersComponent } from 'src/app/components/cards/table-date-filters/table-date-filters.component';
import { GeneratedInvoiceDialogComponent } from 'src/app/components/dialogs/Vendors/generated-invoice-dialog/generated-invoice-dialog.component';
import { RequestClientService } from 'src/app/core/services/request-client.service';
import { Datepicker, Input, initTE } from 'tw-elements';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { Company } from 'src/app/core/models/bank/company/company';
import { TimeoutError, firstValueFrom, from, zip } from 'rxjs';
import { Customer } from 'src/app/core/models/bank/customer';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { LoaderRainbowComponent } from 'src/app/reusables/loader-rainbow/loader-rainbow.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { TableUtilities } from 'src/app/utilities/table-utilities';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceDetailsTable } from 'src/app/core/enums/bank/reports/invoice-details-table';
import { LoginResponse } from 'src/app/core/models/login-response';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';

@Component({
  selector: 'app-invoice-details',
  templateUrl: './invoice-details.component.html',
  styleUrls: ['./invoice-details.component.scss'],
  standalone: true,
  imports: [
    TranslocoModule,
    CommonModule,
    MatDialogModule,
    TableDateFiltersComponent,
    MatPaginatorModule,
    ReactiveFormsModule,
    LoaderRainbowComponent,
    DisplayMessageBoxComponent,
    LoaderInfiniteSpinnerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class InvoiceDetailsComponent implements OnInit {
  public invoiceReports: InvoiceReport[] = [];
  public invoiceReportsData: InvoiceReport[] = [];
  //public companies: Company[] = [];
  //public customers: Customer[] = [];
  public filterFormData: {
    companies: Company[];
    customers: Customer[];
    branches: Branch[];
  } = {
    companies: [],
    customers: [],
    branches: [],
  };
  public formGroup!: FormGroup;
  public headerFormGroup!: FormGroup;
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public InvoiceDetailsTable: typeof InvoiceDetailsTable = InvoiceDetailsTable;
  public userProfile!: LoginResponse;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private tr: TranslocoService,
    private dialog: MatDialog,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private fb: FormBuilder,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef,
    private fileHandler: FileHandlerService,
    @Inject(TRANSLOCO_SCOPE) private scope: any
  ) {}
  private parseUserProfile() {
    let userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      this.userProfile = JSON.parse(userProfile) as LoginResponse;
    }
  }
  private async buildPage() {
    this.startLoading = true;
    let companiesObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.userProfile.braid,
      })
    );
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
  private createRequestFormGroup() {
    this.formGroup = this.fb.group({
      Comp: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.userProfile.braid, []),
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
    this.Comp.valueChanges.subscribe((value) => {
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
          } else {
            if (this.Comp.value !== 'all') {
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
  private createHeaderGroup() {
    this.headerFormGroup = this.fb.group({
      headers: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `invoiceDetails.invoiceDetailsTable`,
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
  private getTableActiveKeys() {
    let indexes = this.headers.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.invoiceReportKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.trim().toLowerCase();
      let keys = this.getTableActiveKeys();
      this.invoiceReports = this.invoiceReportsData.filter((company: any) => {
        return keys.some((key) => {
          return typeof company[key] !== 'string'
            ? false
            : company[key]?.toLowerCase().includes(text);
        });
      });
    } else {
      this.invoiceReports = this.invoiceReportsData;
    }
  }
  private sortTableAsc(ind: number) {
    switch (ind) {
      case InvoiceDetailsTable.INVOICE_NUMBER:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Invoice_No.trim().toLocaleLowerCase() >
          b.Invoice_No.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case InvoiceDetailsTable.INVOICE_DATE:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          new Date(a.Invoice_Date.trim()).toLocaleDateString() >
          new Date(b.Invoice_Date.trim()).toLocaleDateString()
            ? 1
            : -1
        );
        break;
      case InvoiceDetailsTable.CUSTOMER_NAME:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Chus_Name.trim().toLocaleLowerCase() >
          b.Chus_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case InvoiceDetailsTable.TOTAL:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total > b.Total ? 1 : -1
        );
        break;
      case InvoiceDetailsTable.COMPANY_NAME:
        this.invoiceReports.sort((a, b) =>
          a.Company_Name.toLocaleLowerCase() >
          b.Company_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;

      default:
        break;
    }
  }
  private sortTableDesc(ind: number) {
    switch (ind) {
      case InvoiceDetailsTable.INVOICE_NUMBER:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Invoice_No.trim().toLocaleLowerCase() <
          b.Invoice_No.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case InvoiceDetailsTable.INVOICE_DATE:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          new Date(a.Invoice_Date.trim()).toLocaleDateString() <
          new Date(b.Invoice_Date.trim()).toLocaleDateString()
            ? 1
            : -1
        );
        break;
      case InvoiceDetailsTable.CUSTOMER_NAME:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Chus_Name.trim().toLocaleLowerCase() <
          b.Chus_Name.trim().toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      case InvoiceDetailsTable.TOTAL:
        this.invoiceReports.sort((a: InvoiceReport, b: InvoiceReport) =>
          a.Total < b.Total ? 1 : -1
        );
        break;
      case InvoiceDetailsTable.COMPANY_NAME:
        this.invoiceReports.sort((a, b) =>
          a.Company_Name.toLocaleLowerCase() <
          b.Company_Name.toLocaleLowerCase()
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private formErrors(errorsPath = 'reports.invoiceDetails.form.errors.dialog') {
    if (this.Comp.invalid) {
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
  private invoiceReportKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(InvoiceDetailsTable.POSTED_DATE)) {
      keys.push('p_date');
    }
    if (indexes.includes(InvoiceDetailsTable.INVOICE_NUMBER)) {
      keys.push('Invoice_No');
    }
    if (indexes.includes(InvoiceDetailsTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(InvoiceDetailsTable.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    if (indexes.includes(InvoiceDetailsTable.TOTAL)) {
      keys.push('Total');
    }
    if (indexes.includes(InvoiceDetailsTable.STATUS)) {
      keys.push('goods_status');
    }
    if (indexes.includes(InvoiceDetailsTable.COMPANY_NAME)) {
      keys.push('Company_Name');
    }
    if (indexes.includes(InvoiceDetailsTable.CUSTOMER_NAME)) {
      keys.push('Chus_Name');
    }
    if (indexes.includes(InvoiceDetailsTable.INVOICE_DATE)) {
      keys.push('Invoice_Date');
    }
    if (indexes.includes(InvoiceDetailsTable.DUE_DATE)) {
      keys.push('Due_Date');
    }
    if (indexes.includes(InvoiceDetailsTable.EXPIRY_DATE)) {
      keys.push('Invoice_Expired_Date');
    }
    return keys;
  }
  private requestInvoiceDetails(body: InvoiceReportForm) {
    this.tableLoading = true;
    this.invoiceReportService
      .getInvoiceReport(body)
      .then((result) => {
        if (
          result.response &&
          typeof result.response !== 'number' &&
          result.response !== 'string'
        ) {
          this.invoiceReportsData = result.response as InvoiceReport[];
          this.invoiceReports = this.invoiceReportsData;
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
    initTE({ Datepicker, Input });
    this.parseUserProfile();
    this.createRequestFormGroup();
    this.createHeaderGroup();
    this.buildPage();
  }
  submitForm() {
    if (this.formGroup.valid) {
      let form = { ...this.formGroup.value };
      if (form.stdate) {
        form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
      }
      if (form.enddate) {
        form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
      }
      form.branch = this.branch.value;
      this.requestInvoiceDetails(form);
    } else {
      this.formGroup.markAllAsTouched();
      //this.formErrors();
    }
  }
  downloadSheet() {
    if (this.invoiceReportsData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.invoiceReportsData,
        this.getTableActiveKeys(),
        'invoice_reports',
        ['Due_Date', 'Invoice_Expired_Date', 'Invoice_Date', 'p_date']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  moneyFormat(amount: number) {
    return AppUtilities.moneyFormat(amount.toString());
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
  }
  sortColumnClicked(ind: number) {
    let sortAsc = this.headers.at(ind).get('sortAsc');
    sortAsc?.setValue(!sortAsc?.value);
  }
  isCashAmountColumn(index: number) {
    return index === InvoiceDetailsTable.TOTAL;
  }
  openInvoiceDetailsGraph() {
    let dialogRef = this.dialog.open(GeneratedInvoiceDialogComponent, {
      width: '800px',
      height: '600px',
      data: {
        headersMap: {},
        headers: [],
        generatedInvoices: [],
      },
    });
  }
  get Comp() {
    return this.formGroup.get('Comp') as FormControl;
  }
  get cusid() {
    return this.formGroup.get('cusid') as FormControl;
  }
  get branch() {
    return this.formGroup.get('branch') as FormControl;
  }
  get stdate() {
    return this.formGroup.get('stdate') as FormControl;
  }
  get enddate() {
    return this.formGroup.get('enddate') as FormControl;
  }
  get headers() {
    return this.headerFormGroup.get('headers') as FormArray;
  }
  get tableSearch() {
    return this.headerFormGroup.get(`tableSearch`) as FormControl;
  }
}
