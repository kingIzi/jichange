import { CommonModule } from '@angular/common';
import {
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
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { firstValueFrom, from, zip } from 'rxjs';
import { DisplayMessageBoxComponent } from 'src/app/components/dialogs/display-message-box/display-message-box.component';
import { AmendmentReportTable } from 'src/app/core/enums/vendor/reports/amendment-report-table';
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import { LoginResponse } from 'src/app/core/models/login-response';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { FileHandlerService } from 'src/app/core/services/file-handler.service';
import { AmendmentsService } from 'src/app/core/services/vendor/reports/amendments.service';
import { PaymentsService } from 'src/app/core/services/vendor/reports/payments.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { TableUtilities } from 'src/app/utilities/table-utilities';

@Component({
  selector: 'app-amendment',
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule,
    DisplayMessageBoxComponent,
    ReactiveFormsModule,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
  ],
  templateUrl: './amendment.component.html',
  styleUrl: './amendment.component.scss',
  schemas: [NO_ERRORS_SCHEMA],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'bank/reports', alias: 'reports' },
    },
  ],
})
export class AmendmentComponent implements OnInit {
  public startLoading: boolean = false;
  public tableLoading: boolean = false;
  public filterForm!: FormGroup;
  public tableFormGroup!: FormGroup;
  public amendments: GeneratedInvoice[] = [];
  public amendmentsData: GeneratedInvoice[] = [];
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
  public statuses: string[] = ['Paid', 'Pending', 'Cancelled'];
  public paymentTypes: string[] = ['Fixed', 'Flexible'];
  public userProfile!: LoginResponse;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  public AmendmentReportTable: typeof AmendmentReportTable =
    AmendmentReportTable;
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  @ViewChild('paginator') paginator!: MatPaginator;
  constructor(
    private tr: TranslocoService,
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private invoiceReportService: InvoiceReportServiceService,
    private amendmentService: AmendmentsService,
    private branchService: BranchService,
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
  private createFilterForm() {
    this.filterForm = this.fb.group({
      compid: this.fb.control('', [Validators.required]),
      cusid: this.fb.control('', [Validators.required]),
      branch: this.fb.control(this.userProfile.braid, [Validators.required]),
      invno: this.fb.control('', []),
      stdate: this.fb.control('', [Validators.required]),
      enddate: this.fb.control('', [Validators.required]),
    });
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
  private sortTableAsc(ind: number) {
    switch (ind) {
      case AmendmentReportTable.DUE_DATE:
        this.amendments.sort((a, b) =>
          new Date(a.Due_Date) > new Date(b.Due_Date) ? 1 : -1
        );
        break;
      case AmendmentReportTable.INVOICE_NUMBER:
        this.amendments.sort((a, b) => (a.Invoice_No > b.Invoice_No ? 1 : -1));
        break;
      case AmendmentReportTable.CONTROL_NUMBER:
        this.amendments.sort((a, b) =>
          (a.Control_No || '') > (b.Control_No || '') ? 1 : -1
        );
        break;
      case AmendmentReportTable.CUSTOMER_NAME:
        this.amendments.sort((a, b) => (a.Chus_Name > b.Chus_Name ? 1 : -1));
        break;
      case AmendmentReportTable.PAYMENT_TYPE:
        this.amendments.sort((a, b) =>
          (a.Payment_Type || '') > (b.Payment_Type || '') ? 1 : -1
        );
        break;
      case AmendmentReportTable.REASON:
        this.amendments.sort((a, b) =>
          (a.Reason || '') > (b.Reason || '') ? 1 : -1
        );
        break;
      case AmendmentReportTable.EXPIRY_DATE:
        this.amendments.sort((a, b) =>
          new Date(a.Invoice_Expired_Date) > new Date(b.Invoice_Expired_Date)
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
      case AmendmentReportTable.DUE_DATE:
        this.amendments.sort((a, b) =>
          new Date(a.Due_Date) < new Date(b.Due_Date) ? 1 : -1
        );
        break;
      case AmendmentReportTable.INVOICE_NUMBER:
        this.amendments.sort((a, b) => (a.Invoice_No < b.Invoice_No ? 1 : -1));
        break;
      case AmendmentReportTable.CONTROL_NUMBER:
        this.amendments.sort((a, b) =>
          (a.Control_No || '') < (b.Control_No || '') ? 1 : -1
        );
        break;
      case AmendmentReportTable.CUSTOMER_NAME:
        this.amendments.sort((a, b) => (a.Chus_Name < b.Chus_Name ? 1 : -1));
        break;
      case AmendmentReportTable.PAYMENT_TYPE:
        this.amendments.sort((a, b) =>
          (a.Payment_Type || '') < (b.Payment_Type || '') ? 1 : -1
        );
        break;
      case AmendmentReportTable.REASON:
        this.amendments.sort((a, b) =>
          (a.Reason || '') < (b.Reason || '') ? 1 : -1
        );
        break;
      case AmendmentReportTable.EXPIRY_DATE:
        this.amendments.sort((a, b) =>
          new Date(a.Invoice_Expired_Date) < new Date(b.Invoice_Expired_Date)
            ? 1
            : -1
        );
        break;
      default:
        break;
    }
  }
  private async createHeaderGroup() {
    this.tableFormGroup = this.fb.group({
      tableHeaders: this.fb.array([], []),
      tableSearch: this.fb.control('', []),
    });
    TableUtilities.createHeaders(
      this.tr,
      `amendmentDetails.amendmentTable`,
      this.scope,
      this.tableHeaders,
      this.fb,
      this,
      6,
      true
    );
    this.tableSearch.valueChanges.subscribe((value) => {
      this.searchTable(value, this.paginator);
    });
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
  private requestAmendmentsReport(value: any) {
    this.tableLoading = true;
    this.amendmentService
      .getAmendmentsReport(value)
      .then((result) => {
        console.log(result);
        if (
          typeof result.response === 'string' &&
          typeof result.response === 'number'
        ) {
          AppUtilities.openDisplayMessageBox(
            this.displayMessageBox,
            this.tr.translate(`defaults.failed`),
            this.tr.translate(`errors.noDataFound`)
          );
        } else {
          this.amendmentsData = result.response as GeneratedInvoice[];
          this.amendments = this.amendmentsData;
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
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(this.reportsService.getCompaniesList({}));
    let branchObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(companiesObs, branchObs));
    res
      .then((results) => {
        let [companies, branchList] = results;
        if (typeof companies.response !== 'number') {
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
  private amendmentReportTableKeys(indexes: number[]) {
    let keys: string[] = [];
    if (indexes.includes(AmendmentReportTable.DUE_DATE)) {
      keys.push('Due_Date');
    }
    if (indexes.includes(AmendmentReportTable.INVOICE_NUMBER)) {
      keys.push('Invoice_No');
    }
    if (indexes.includes(AmendmentReportTable.CONTROL_NUMBER)) {
      keys.push('Control_No');
    }
    if (indexes.includes(AmendmentReportTable.CUSTOMER_NAME)) {
      keys.push('Chus_Name');
    }
    if (indexes.includes(AmendmentReportTable.PAYMENT_TYPE)) {
      keys.push('Payment_Type');
    }
    if (indexes.includes(AmendmentReportTable.REASON)) {
      keys.push('Reason');
    }
    if (indexes.includes(AmendmentReportTable.EXPIRY_DATE)) {
      keys.push('Invoice_Expired_Date');
    }
    return keys;
  }
  private getTableActiveKeys() {
    let indexes = this.tableHeaders.controls
      .map((control, index) => {
        return control.get('included')?.value ? index : -1;
      })
      .filter((num) => num !== -1);
    return this.amendmentReportTableKeys(indexes);
  }
  private searchTable(searchText: string, paginator: MatPaginator) {
    if (searchText) {
      paginator.firstPage();
      let text = searchText.trim().toLowerCase();
      let keys = this.getTableActiveKeys();
      this.amendments = this.amendmentsData.filter((company: any) => {
        return keys.some((key) => company[key]?.toLowerCase().includes(text));
      });
    } else {
      this.amendments = this.amendmentsData;
    }
  }
  ngOnInit(): void {
    this.parseUserProfile();
    this.createFilterForm();
    this.createHeaderGroup();
    this.buildPage();
  }
  getFormControl(control: AbstractControl, name: string) {
    return control.get(name) as FormControl;
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
      this.requestAmendmentsReport(form);
    } else {
      this.filterForm.markAllAsTouched();
    }
  }
  downloadSheet() {
    if (this.amendmentsData.length > 0) {
      this.fileHandler.downloadExcelTable(
        this.amendmentsData,
        this.getTableActiveKeys(),
        'amendment_reports',
        ['Due_Date', 'Invoice_Expired_Date']
      );
    } else {
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.failed`),
        this.tr.translate(`errors.noDataFound`)
      );
    }
  }
  isCashAmountColumn(index: number) {
    return false;
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
