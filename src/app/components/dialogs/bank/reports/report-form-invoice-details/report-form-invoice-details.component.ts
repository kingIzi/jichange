import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
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
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import {
  BankLoginResponse,
  VendorLoginResponse,
} from 'src/app/core/models/login-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { from, zip } from 'rxjs';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { InvoiceDetailsForm } from 'src/app/core/models/vendors/forms/payment-report-form';

@Component({
  selector: 'app-report-form-invoice-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    TranslocoModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    DisplayMessageBoxComponent,
  ],
  templateUrl: './report-form-invoice-details.component.html',
  styleUrl: './report-form-invoice-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DatePipe,
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class ReportFormInvoiceDetailsComponent implements OnInit {
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
  public startLoading: boolean = false;
  public filterForm!: FormGroup;
  public PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  @Input() public allowCancelledInvoices: boolean = false;
  @Output() public formData: EventEmitter<InvoiceDetailsForm> =
    new EventEmitter<InvoiceDetailsForm>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private appConfig: AppConfigService,
    private reportsService: ReportsService,
    private branchService: BranchService,
    private invoiceReportService: InvoiceReportServiceService,
    private cdr: ChangeDetectorRef,
    private tr: TranslocoService
  ) {}
  private initializedFilterFormGroup() {
    let profile: BankLoginResponse | VendorLoginResponse =
      this.appConfig.getLoginResponse();
    if (profile.userType.toLocaleLowerCase() === 'BNk'.toLocaleLowerCase()) {
      profile = profile as BankLoginResponse;
      this.filterForm = this.fb.group({
        compid: this.fb.control(0, [Validators.required]),
        cusid: this.fb.control(0, [Validators.required]),
        branch: this.fb.control(profile.braid, [Validators.required]),
        invno: this.fb.control('', []),
        stdate: this.fb.control('', []),
        enddate: this.fb.control('', []),
      });
    } else {
      profile = profile as VendorLoginResponse;
      this.filterForm = this.fb.group({
        compid: this.fb.control(profile.InstID, [Validators.required]),
        cusid: this.fb.control(0, [Validators.required]),
        branch: this.fb.control(profile.braid, [Validators.required]),
        invno: this.fb.control('', []),
        stdate: this.fb.control('', []),
        enddate: this.fb.control('', []),
      });
    }
    return profile;
  }
  private handleCompanyChanged(compid: number) {
    if (compid > 0) {
      this.requestCustomerDetailsList({ companyIds: [compid] });
    } else if (compid === 0 && this.filterFormData.companies.length === 0) {
      this.filterFormData.customers = [];
    } else if (compid === 0 && this.filterFormData.companies.length > 0) {
      let companyIds = this.filterFormData.companies.map((c) => {
        return c.CompSno;
      });
      this.requestCustomerDetailsList({ companyIds: companyIds });
    }
  }
  private assignCustomersFilterData(
    result: HttpDataResponse<string | number | Customer[]>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.filterFormData.customers = [];
    } else {
      this.filterFormData.customers = result.response as Customer[];
      if (this.filterFormData.customers.length === 0) {
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          this.tr.translate(
            `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
          )
        );
      }
    }
    this.cusid.setValue(0);
  }
  private requestCustomerDetailsList(body: { companyIds: number[] }) {
    this.reportsService
      .getCustomerDetailsByCompany(body)
      .then((result) => {
        this.assignCustomersFilterData(result);
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
        this.cusid.setValue(0);
        this.startLoading = false;
        this.cdr.detectChanges();
        throw err;
      });
  }
  private companyChangedEventHandler() {
    this.compid.valueChanges.subscribe((value) => {
      let compid = Number(value);
      this.handleCompanyChanged(compid);
    });
  }
  private createFilterForm() {
    let profile = this.initializedFilterFormGroup();
    if (Number(profile.braid) > 0) {
      this.branch.disable();
    }
    if (profile.userType.toLocaleLowerCase() === 'Comp'.toLocaleLowerCase()) {
      this.compid.disable();
    }
    if (Number(profile.braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.companyChangedEventHandler();
    this.filterFormChanged(profile);
  }
  private handleFilterFormChanged(compid: number, cusid: number) {
    if (compid >= 0 && cusid >= 0) {
      let companyIds: number[] = [];
      if (compid > 0) {
        companyIds = [compid];
      } else if (compid === 0 && this.filterFormData.companies.length > 0) {
        companyIds = this.filterFormData.companies.map((c) => {
          return c.CompSno;
        });
      }
      let customerIds: number[] = [];
      if (cusid > 0) {
        customerIds = [cusid];
      } else if (cusid === 0 && this.filterFormData.customers.length > 0) {
        customerIds = this.filterFormData.customers.map((c) => {
          return c.Cust_Sno;
        });
      }
      let form = {
        companyIds: companyIds,
        customerIds: customerIds,
        stdate: '',
        enddate: '',
        allowCancelInvoice: this.allowCancelledInvoices,
      } as InvoiceReportForm;
      this.requestInvoicesList(form);
    }
  }
  private filterFormChanged(profile: BankLoginResponse | VendorLoginResponse) {
    this.filterForm.valueChanges.subscribe((value) => {
      if (profile.userType.toLocaleLowerCase() === 'BNk'.toLocaleLowerCase()) {
        this.handleFilterFormChanged(Number(value.compid), Number(value.cusid));
      } else {
        profile = profile as VendorLoginResponse;
        this.handleFilterFormChanged(profile.InstID, Number(value.cusid));
      }
    });
  }
  private noInvoicesFoundErrorMessage() {
    let customer = this.filterFormData.customers.find(
      (elem) => elem.Cust_Sno === Number(this.cusid.value)
    );
    if (customer) {
      let message = this.tr
        .translate(`reports.amendmentDetails.noInvoicesFound`)
        .replace('{}', customer.Cust_Name);
      AppUtilities.openDisplayMessageBox(
        this.displayMessageBox,
        this.tr.translate(`defaults.warning`),
        message
      );
    }
  }
  private assignInvoiceListFilterData(
    result: HttpDataResponse<string | number | InvoiceReport[]>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.filterFormData.customers = [];
      this.noInvoicesFoundErrorMessage();
    } else {
      this.filterFormData.invoiceReports = result.response as InvoiceReport[];
      if (this.filterFormData.invoiceReports.length === 0) {
        this.noInvoicesFoundErrorMessage();
      }
    }
    //this.invno.setValue('');
  }
  private requestInvoicesList(body: InvoiceReportForm) {
    this.startLoading = true;
    this.invoiceReportService
      .getInvoiceReport(body)
      .then((result) => {
        this.assignInvoiceListFilterData(result);
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
  private assignCompaniesFilterData(
    result: HttpDataResponse<string | number | Company[]>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.filterFormData.companies = [];
    } else {
      this.filterFormData.companies = result.response as Company[];
      if (this.filterFormData.companies.length === 0) {
        AppUtilities.openDisplayMessageBox(
          this.displayMessageBox,
          this.tr.translate(`defaults.warning`),
          this.tr
            .translate(`reports.customerDetailReport.noVendorsFoundInBranch`)
            .replace(
              '{}',
              this.filterFormData.branches.find(
                (b) => b.Branch_Sno.toString() === this.branch.value
              )?.Name as string
            )
        );
      }
    }
    if (this.compid.enabled) {
      this.compid.setValue(0);
    } else {
      this.handleCompanyChanged(Number(this.compid.value));
    }
  }
  private requestCompaniesList(body: { branch: number | string }) {
    this.startLoading = true;
    this.reportsService
      .getBranchedCompanyList(body)
      .then((result) => {
        this.assignCompaniesFilterData(result);
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
  private branchChangedEventHandler() {
    this.branch.valueChanges.subscribe((value) => {
      this.requestCompaniesList({ branch: value });
    });
  }
  private assignBranchesFilterData(
    result: HttpDataResponse<number | Branch[]>
  ) {
    let isErrorResult = AppUtilities.hasErrorResult(result);
    if (isErrorResult) {
      this.filterFormData.branches = [];
    } else {
      this.filterFormData.branches = result.response as Branch[];
    }
  }
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.branch.value,
      })
    );
    let branchObs = from(this.branchService.postBranchList({}));
    let res = AppUtilities.pipedObservables(zip(companiesObs, branchObs));
    res
      .then((results) => {
        let [companiesList, branchList] = results;
        this.assignCompaniesFilterData(companiesList);
        this.assignBranchesFilterData(branchList);
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
    this.createFilterForm();
    this.buildPage();
  }
  submitFilterForm() {
    if (this.filterForm.valid) {
      let form = { ...this.filterForm.value };
      if (form.stdate) {
        //form.stdate = new Date(form.stdate).toISOString();
        let startDate = new Date(form.stdate);
        startDate.setHours(0, 0, 0, 0);
        form.stdate = startDate.toISOString();
      }
      if (form.enddate) {
        //form.enddate = new Date(form.enddate).toISOString();
        let endDate = new Date(form.enddate);
        endDate.setHours(23, 59, 59, 999);
        form.enddate = endDate.toISOString();
      }
      form.branch = this.branch.value;
      form.compid = this.compid.value;
      let compid = Number(form.compid);
      let companyIds: number[] = [];
      if (compid > 0) {
        companyIds = [compid];
      } else if (compid === 0 && this.filterFormData.companies.length > 0) {
        companyIds = this.filterFormData.companies.map((c) => {
          return c.CompSno;
        });
      } else {
        companyIds = [];
      }

      let cusid = Number(form.cusid);
      let customersIds: number[] = [];
      if (cusid > 0) {
        customersIds = [cusid];
      } else if (cusid === 0 && this.filterFormData.customers.length > 0) {
        customersIds = this.filterFormData.customers.map((c) => {
          return c.Cust_Sno;
        });
      } else {
        customersIds = [];
      }

      let invno = Number(form.invno);
      let invoiceIds: number[] = [];
      if (invno > 0) {
        invoiceIds = [invno];
      } else if (invno === 0 && this.filterFormData.invoiceReports.length > 0) {
        invoiceIds = this.filterFormData.invoiceReports.map((c) => {
          return c.Inv_Mas_Sno;
        });
      } else {
        invoiceIds = [];
      }

      let body = {
        companyIds: companyIds,
        customerIds: customersIds,
        invoiceIds: invoiceIds,
        stdate: form.stdate,
        enddate: form.enddate,
      } as InvoiceDetailsForm;

      this.formData.emit(body);

      //this.requestPaymentReport(form);
    } else {
      this.filterForm.markAllAsTouched();
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
}
