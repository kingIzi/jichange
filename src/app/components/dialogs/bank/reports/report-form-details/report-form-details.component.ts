import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
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
import { BankLoginResponse } from 'src/app/core/models/login-response';
import { AppConfigService } from 'src/app/core/services/app-config.service';
import { LoaderInfiniteSpinnerComponent } from 'src/app/reusables/loader-infinite-spinner/loader-infinite-spinner.component';
import { DisplayMessageBoxComponent } from '../../../display-message-box/display-message-box.component';
import { ReportsService } from 'src/app/core/services/bank/reports/reports.service';
import { AppUtilities } from 'src/app/utilities/app-utilities';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { InvoiceReportFormBanker } from 'src/app/core/models/vendors/forms/invoice-report-form';
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
  @Output() public formData: EventEmitter<InvoiceReportFormBanker> =
    new EventEmitter<InvoiceReportFormBanker>();
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
  private createRequestFormGroup() {
    this.formGroup = this.fb.group({
      Comp: this.fb.control(0, [Validators.required]),
      cusid: this.fb.control(0, [Validators.required]),
      branch: this.fb.control(this.getUserProfile().braid, []),
      stdate: this.fb.control('', []),
      enddate: this.fb.control('', []),
    });
    if (Number(this.getUserProfile().braid) > 0) {
      this.branch.disable();
    }
    if (Number(this.getUserProfile().braid) === 0) {
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
          this.tr.translate(
            `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
          )
        );
      }
    }
    this.cusid.setValue(0);
  }
  private requestCustomerDetailsList(body: { Sno: number }) {
    this.reportsService
      .getCustomerDetailsList(body)
      .then((result) => {
        // if (
        //   typeof result.response !== 'number' &&
        //   typeof result.response !== 'string'
        // ) {
        //   this.filterFormData.customers = result.response;
        // } else {
        //   if (this.Comp.value !== 0) {
        //     AppUtilities.openDisplayMessageBox(
        //       this.displayMessageBox,
        //       this.tr.translate(`defaults.warning`),
        //       this.tr.translate(
        //         `reports.invoiceDetails.form.errors.dialog.noCustomersFound`
        //       )
        //     );
        //   }
        //   this.filterFormData.customers = [];
        //   this.cusid.setValue(0);
        // }
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
    this.Comp.valueChanges.subscribe((value) => {
      this.requestCustomerDetailsList({ Sno: value });
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
    this.Comp.setValue(0);
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
      let form = { ...this.formGroup.value } as InvoiceReportFormBanker;
      if (form.stdate) {
        form.stdate = AppUtilities.reformatDate(this.stdate.value.split('-'));
      }
      if (form.enddate) {
        form.enddate = AppUtilities.reformatDate(this.enddate.value.split('-'));
      }
      form.branch = this.branch.value;
      this.formData.emit(form);
    } else {
      this.formGroup.markAllAsTouched();
    }
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
