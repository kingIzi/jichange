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
import { Company } from 'src/app/core/models/bank/company/company';
import { Customer } from 'src/app/core/models/bank/customer';
import { Branch } from 'src/app/core/models/bank/setup/branch';
import {
  BankLoginResponse,
  VendorLoginResponse,
} from 'src/app/core/models/login-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import {
  TRANSLOCO_SCOPE,
  TranslocoModule,
  TranslocoService,
} from '@ngneat/transloco';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  InvoiceReportForm,
  InvoiceReportFormBanker,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
import { CommonModule } from '@angular/common';
import { PerformanceUtils } from 'src/app/utilities/performance-utils';
import { from, zip } from 'rxjs';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';

@Component({
  selector: 'app-report-form-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LoaderInfiniteSpinnerComponent,
    DisplayMessageBoxComponent,
    TranslocoModule,
    CommonModule,
  ],
  templateUrl: './report-form-details.component.html',
  styleUrl: './report-form-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: { scope: 'vendor/reports', alias: 'reports' },
    },
  ],
})
export class ReportFormDetailsComponent implements OnInit {
  public startLoading: boolean = false;
  public formGroup!: FormGroup;
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
  @Input() public dateLabel: string = '';
  @Output() public formData: EventEmitter<InvoiceReportForm> =
    new EventEmitter<InvoiceReportForm>();
  @ViewChild('displayMessageBox')
  displayMessageBox!: DisplayMessageBoxComponent;
  constructor(
    private fb: FormBuilder,
    private appConfig: AppConfigService,
    private tr: TranslocoService,
    private reportsService: ReportsService,
    private branchService: BranchService,
    private cdr: ChangeDetectorRef
  ) {}
  private initializeFormGroup() {
    let profile: BankLoginResponse | VendorLoginResponse =
      this.appConfig.getLoginResponse();
    if (profile.userType.toLocaleLowerCase() === 'BNk'.toLocaleLowerCase()) {
      profile = profile as BankLoginResponse;
      this.formGroup = this.fb.group({
        Comp: this.fb.control(0, [Validators.required]),
        cusid: this.fb.control(0, [Validators.required]),
        branch: this.fb.control(profile.braid, []),
        stdate: this.fb.control('', []),
        enddate: this.fb.control('', []),
      });
    } else {
      profile = profile as VendorLoginResponse;
      this.formGroup = this.fb.group({
        Comp: this.fb.control(profile.InstID, [Validators.required]),
        cusid: this.fb.control(0, [Validators.required]),
        branch: this.fb.control(profile.braid, []),
        stdate: this.fb.control('', []),
        enddate: this.fb.control('', []),
      });
    }
    return profile;
  }
  private createRequestFormGroup() {
    let profile: BankLoginResponse | VendorLoginResponse =
      this.initializeFormGroup();
    if (Number(profile.braid) > 0) {
      this.branch.disable();
    }
    if (profile.userType.toLocaleLowerCase() === 'Comp'.toLocaleLowerCase()) {
      this.Comp.disable();
    }
    if (Number(profile.braid) === 0) {
      this.branchChangedEventHandler();
    }
    this.companyChangedEventHandler();
  }
  private branchChangedEventHandler() {
    this.branch.valueChanges.subscribe((value) => {
      this.requestCompaniesList({ branch: value });
    });
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
          this.tr.translate(`reports.overview.noCustomersFound`)
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
  private handleCompanyChanged(compid: number) {
    if (compid > 0) {
      this.requestCustomerDetailsList({ companyIds: [compid] });
    } else if (compid === 0 && this.filterFormData.companies.length > 0) {
      let companyIds = this.filterFormData.companies.map((c) => {
        return c.CompSno;
      });
      this.requestCustomerDetailsList({ companyIds: companyIds });
    }
  }
  private companyChangedEventHandler() {
    this.Comp.valueChanges.subscribe((value) => {
      let compid = Number(value);
      this.handleCompanyChanged(compid);
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
  private assignCompaniesFilterData(
    result: HttpDataResponse<number | Company[]>
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
            .translate(`reports.overview.noVendorsFoundInBranch`)
            .replace(
              '{}',
              this.filterFormData.branches.find(
                (b) => b.Branch_Sno.toString() === this.branch.value
              )?.Name as string
            )
        );
      }
    }
    // if (this.Comp.enabled) {
    //   this.Comp.setValue(0);
    // } else {
    //   this.handleCompanyChanged(Number(this.Comp.value));
    // }
    if (this.Comp.enabled) {
      this.Comp.setValue(0);
    } else {
      this.Comp.setValue(
        (this.appConfig.getLoginResponse() as VendorLoginResponse).InstID
      );
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
  private buildPage() {
    this.startLoading = true;
    let companiesObs = from(
      this.reportsService.getBranchedCompanyList({
        branch: this.getUserProfile().braid,
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
    this.createRequestFormGroup();
    this.buildPage();
  }
  getUserProfile() {
    return this.appConfig.getLoginResponse() as BankLoginResponse;
  }
  submitForm() {
    if (this.formGroup.valid) {
      let form = { ...this.formGroup.value };
      if (form.stdate) {
        let startDate = new Date(form.stdate);
        startDate.setHours(0, 0, 0, 0);
        form.stdate = startDate.toISOString();
      }
      if (form.enddate) {
        let endDate = new Date(form.enddate);
        endDate.setHours(23, 59, 59, 999);
        form.enddate = endDate.toISOString();
      }
      form.branch = this.branch.value;
      form.Comp = this.Comp.value;
      let compid = Number(form.Comp);
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

      let body = {
        companyIds: companyIds,
        customerIds: customersIds,
        stdate: form.stdate,
        enddate: form.enddate,
      } as InvoiceReportForm;

      this.formData.emit(body);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }
  isBankUser() {
    let profile: BankLoginResponse | VendorLoginResponse =
      this.appConfig.getLoginResponse();
    return profile.userType.toLocaleLowerCase() === 'BNk'.toLocaleLowerCase();
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
}
