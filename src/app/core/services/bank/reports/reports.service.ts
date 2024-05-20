import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { Company } from 'src/app/core/models/bank/company/company';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private client: RequestClientService) {}
  public async postCustomerDetailsReport(body: {
    Comp: string;
    reg: string;
    dist: string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/RepCustomer/getcustdetreport`, body)
    );
    return data;
  }
  public async getCustomerDetailsList(body: { Sno: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/InvoiceRep/getcustdetails`, body)
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
