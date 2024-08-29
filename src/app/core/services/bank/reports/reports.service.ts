import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { Company } from 'src/app/core/models/bank/company/company';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Customer } from 'src/app/core/models/bank/customer';
import { VendorDetailsReportForm } from 'src/app/core/models/bank/forms/reports/vendor-details-report-form';
import { DashboardOverviewStatistic } from 'src/app/core/models/bank/reports/dashboard-overview-statistic';
import { TransactionDetailsReportForm } from 'src/app/core/models/bank/forms/reports/transaction-details-report-form';
import { TransactionDetail } from 'src/app/core/models/bank/reports/transaction-detail';
import { UserLog } from 'src/app/core/models/bank/reports/user-log';
import { InvoiceConsolidatedReport } from 'src/app/core/models/bank/reports/invoice-consolidated-report';
import { InvoiceReportForm } from 'src/app/core/models/vendors/forms/invoice-report-form';
import { CustomerDetailsForm } from 'src/app/core/models/bank/reports/customer-details-form';
import { InvoiceDetailsForm } from 'src/app/core/models/vendors/forms/payment-report-form';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private client: RequestClientService) {}
  public async postCustomerDetailsReport(
    body: VendorDetailsReportForm | CustomerDetailsForm
  ) {
    let data = await lastValueFrom(
      this.client.performPost<
        VendorDetailsReportForm | CustomerDetailsForm,
        HttpDataResponse<Customer[] | string | number>
      >(`/api/RepCustomer/getcustdetreport`, body)
    );
    return data;
  }
  public async getCustomerDetailsList(body: { Sno: string | number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { Sno: string | number },
        HttpDataResponse<Customer[] | number | string>
      >(`/api/InvoiceRep/getcustdetails`, body)
    );
    return data;
  }
  public async getCustomerDetailsByCompany(body: { companyIds: number[] }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { companyIds: number[] },
        HttpDataResponse<Customer[] | number | string>
      >(`/api/InvoiceRep/getcustdetails`, body)
    );
    return data;
  }
  public async getCompaniesList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<
        {},
        HttpDataResponse<Company[] | string | number>
      >(`/api/InvoiceRep/CompList`, body)
    );
    return data;
  }
  public async getBranchedCompanyList(body: { branch: number | string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { branch: number | string },
        HttpDataResponse<Company[] | number>
      >(`/api/InvoiceRep/CompListB`, body)
    );
    return data;
  }
  public async getAllCompaniesByBranch(body: { branch: number | string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { branch: number | string },
        HttpDataResponse<Company[] | number>
      >(`/api/InvoiceRep/GetCompaniesByBranch`, body)
    );
    return data;
  }
  public async getUserLogTimes(body: { stdate: string; enddate: string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { stdate: string; enddate: string },
        HttpDataResponse<UserLog[] | number | string>
      >(`/api/UserLog/LogtimeRep`, body)
    );
    return data;
  }
  public async requestInvoiceReport(body: {
    Comp: string;
    cusid: string;
    stdate: string;
    enddate: string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/InvoiceRep/getInvReport`, body)
    );
    return data;
  }
  public async getBankerInvoiceStats(body: { branch: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { branch: number },
        HttpDataResponse<DashboardOverviewStatistic[] | number | string>
      >(`/api/Setup/Overview`, body)
    );
    return data;
  }
  public async getTransactionsReport(
    body: TransactionDetailsReportForm | InvoiceReportForm | InvoiceDetailsForm
  ) {
    let data = await lastValueFrom(
      this.client.performPost<
        TransactionDetailsReportForm | InvoiceReportForm | InvoiceDetailsForm,
        HttpDataResponse<TransactionDetail[] | number | string>
      >(`/api/Invoice/GetchTransact_B`, body)
    );
    return data;
  }
  public async getInvoicePaymentDetails(body: { invoice_sno: string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { invoice_sno: string },
        HttpDataResponse<TransactionDetail[] | number | string>
      >(`/api/invoice/GetchTransact_Inv`, body)
    );
    return data;
  }
  public async getLatestTransactionsList(body: { branch: number | string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { branch: number | string },
        HttpDataResponse<string | number | TransactionDetail[]>
      >(`/api/Setup/LatTransList`, body)
    );
    return data;
  }
  public async getInvoiceConsolidatedReports(body: {
    stdate: string;
    enddate: string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { stdate: string; enddate: string },
        HttpDataResponse<number | string | InvoiceConsolidatedReport[]>
      >(`/api/Invoice/GetConsoReport`, body)
    );
    return data;
  }
  public async getPaymentConsolidatedReport(body: {
    stdate: string;
    enddate: string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        {
          stdate: string;
          enddate: string;
        },
        HttpDataResponse<number | string | InvoiceConsolidatedReport[]>
      >(`/api/Invoice/GetConsoPayment`, body)
    );
    return data;
  }
}
