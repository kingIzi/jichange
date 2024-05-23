import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { Company } from 'src/app/core/models/bank/company/company';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Customer } from 'src/app/core/models/bank/customer';
import { VendorDetailsReportForm } from 'src/app/core/models/bank/forms/reports/vendor-details-report-form';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private client: RequestClientService) {}
  public async postCustomerDetailsReport(body: VendorDetailsReportForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        VendorDetailsReportForm,
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
  public async getCompaniesList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<
        {},
        HttpDataResponse<Company[] | string | number>
      >(`/api/InvoiceRep/CompList`, body)
    );
    return data;
  }
  public async getUserLogTimes(body: { stdate: string; enddate: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/UserLog/LogtimeRep`, body)
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
}
