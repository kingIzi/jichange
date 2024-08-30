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
import { from, Observable, of, zip } from 'rxjs';
import { BranchService } from 'src/app/core/services/bank/setup/branch/branch.service';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { InvoiceReportServiceService } from 'src/app/core/services/bank/reports/invoice-details/invoice-report-service.service';
import { InvoiceDetailsForm } from 'src/app/core/models/vendors/forms/payment-report-form';
import { ReportFormInvoiceDetails } from 'src/app/core/models/bank/reports/report-form-invoice-details';
import { ReportFormDetailsComponent } from '../report-form-details/report-form-details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
export class ReportFormInvoiceDetailsComponent extends ReportFormDetailsComponent {
  @Input() public allowCancelledInvoices: boolean = false;
  public override PerformanceUtils: typeof PerformanceUtils = PerformanceUtils;
  private noInvoicesFoundErrorMessage() {
    let customer = this.filterFormData.customers.find(
      (elem) => elem.Cust_Sno === Number(this.cusid.value)
    );
    if (customer) {
      let message = this.tr
        .translate(`reports.invoiceDetails.noInvoicesFound`)
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
  private filterFormChanged() {
    let profile = this.appConfig.getLoginResponse();
    this.filterForm.valueChanges.subscribe((value) => {
      if (profile.userType.toLocaleLowerCase() === 'BNk'.toLocaleLowerCase()) {
        this.handleFilterFormChanged(Number(value.Comp), Number(value.cusid));
      } else {
        profile = profile as VendorLoginResponse;
        this.handleFilterFormChanged(
          Number(profile.InstID),
          Number(value.cusid)
        );
      }
    });
  }
  override ngOnInit(): void {
    this.createRequestFormGroup();
    this.buildPage();
    this.filterFormChanged();
  }
  submitFilterForm() {
    if (this.filterForm.valid) {
      this.cdr.detectChanges();

      let form = { ...this.filterForm.value };
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
      form.compid = this.Comp.value;
      let compid = Number(form.compid);
      let companyIds: number[] = [];
      if (compid > 0) {
        companyIds = [compid];
      } else {
        companyIds = this.filterFormData.companies.map((c) => {
          return c.CompSno;
        });
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
        customersIds = [0];
      }

      // else {
      //   customersIds = this.filterFormData.customers.map((c) => {
      //     return c.Cust_Sno;
      //   });
      // }

      let invno = Number(form.invno);
      let invoiceIds: number[] = [];
      if (invno > 0) {
        invoiceIds = [invno];
      } else if (invno === 0 && this.filterFormData.invoiceReports.length > 0) {
        invoiceIds = this.filterFormData.invoiceReports.map((c) => {
          return c.Inv_Mas_Sno;
        });
      } else {
        invoiceIds = [0];
      }

      // else if ()
      // else {
      //   invoiceIds = this.filterFormData.invoiceReports.map((c) => {
      //     return c.Inv_Mas_Sno;
      //   });
      // }

      let body = {
        companyIds: companyIds,
        customerIds: customersIds,
        invoiceIds: invoiceIds,
        stdate: form.stdate,
        enddate: form.enddate,
      } as InvoiceDetailsForm;

      this.cdr.detectChanges();

      this.formData.emit(body);
    } else {
      this.filterForm.markAllAsTouched();
    }
  }
}
