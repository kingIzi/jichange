import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AddInvoiceForm } from '../../models/vendors/forms/add-invoice-form';
import { HttpDataResponse } from '../../models/http-data-response';
import { GeneratedInvoice } from '../../models/vendors/generated-invoice';
import { AddCancelForm } from '../../models/vendors/forms/add-cancel-form';
import { CustomerName } from '../../models/vendors/customer-name';
import { AmendInvoiceForm } from '../../models/vendors/forms/amend-invoice-form';
import { Currency } from '../../models/vendors/currency';
import { DashboardOverviewStatistic } from '../../models/bank/reports/dashboard-overview-statistic';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  constructor(private client: RequestClientService) {}
  public async postSignedDetails(body: { compid: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: number },
        HttpDataResponse<GeneratedInvoice[] | string>
      >(`/api/Invoice/GetSignedDetails`, body)
    );
    return data;
  }
  public async invoiceDetailsById(body: { compid: number; invid: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: number; invid: number },
        HttpDataResponse<GeneratedInvoice>
      >(`/api/invoice/GetInvoiceDetailsbyid`, body)
    );
    return data;
  }
  public async getGeneratedInvoicebyId(body: {
    compid: number | string;
    invid: number | string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: number | string; invid: number | string },
        HttpDataResponse<GeneratedInvoice | string>
      >(`/api/Invoice/GetSignedInvoiceByid`, body)
    );
    return data;
  }
  public async invoiceItemDetails(body: { invid: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { invid: number },
        HttpDataResponse<GeneratedInvoice[]>
      >(`/api/Invoice/GetInvoiceInvoicedetails`, body)
    );
    return data;
  }
  public async getInvoiceCustomerNames(body: { compid: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: number },
        HttpDataResponse<CustomerName[] | string | number>
      >(`/api/Invoice/GetCustomersS`, body)
    );
    return data;
  }
  public async getCurrencyCodes() {
    let data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<Currency[] | number>>(
        `/api/Invoice/GetCurrency`
      )
    );
    return data;
  }
  public async getCompanyS(body: { compid: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: number },
        HttpDataResponse<
          string | number | { Comp_Mas_Sno: number; Company_Name: string }
        >
      >(`/api/Invoice/GetCompanyS`, body)
    );
    return data;
  }
  public async addInvoice(body: AddInvoiceForm) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/AddInvoice`, body)
    );
    return data;
  }
  public async getCreatedInvoiceList(body: { compid: string | number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: string | number },
        HttpDataResponse<GeneratedInvoice[] | string>
      >(`/api/Invoice/GetchDetails`, body)
    );
    return data;
  }
  public async cancelInvoice(body: AddCancelForm) {
    let data = await lastValueFrom(
      this.client.performPost<AddCancelForm, HttpDataResponse<number | string>>(
        `/api/Invoice/AddCancel`,
        body
      )
    );
    return data;
  }
  public async addAmendment(body: AmendInvoiceForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AmendInvoiceForm,
        HttpDataResponse<number | string>
      >(`/api/Invoice/AddAmend`, body)
    );
    return data;
  }
  public async getCompanysInvoiceStats(body: { compid: string | number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: string | number },
        HttpDataResponse<DashboardOverviewStatistic[] | number | string>
      >(`/api/Setup/Overview`, body)
    );
    return data;
  }
}
