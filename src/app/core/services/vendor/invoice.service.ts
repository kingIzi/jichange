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
        HttpDataResponse<GeneratedInvoice[] | number>
      >(`/api/Invoice/GetSignedDetails`, body)
    );
    return data;
  }
  public signedDetailsList(body: { compid: number }) {
    return this.client.performPost<
      { compid: number },
      HttpDataResponse<GeneratedInvoice[] | number>
    >(`/api/Invoice/GetSignedDetails`, body);
  }
  public isExistInvoice(compid: number, invno: string) {
    let data = this.client.performGet<HttpDataResponse<number | boolean>>(
      `/api/Invoice/IsExistInvoice?compid=${compid}&invno=${invno}`
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
        HttpDataResponse<CustomerName[] | number>
      >(`/api/Invoice/GetCustomersS`, body)
    );
    return data;
  }
  public async getCurrencyCodes() {
    let data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<Currency[] | number | string>>(
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
      this.client.performPost<
        AddInvoiceForm,
        HttpDataResponse<GeneratedInvoice | number>
      >(`/api/Invoice/AddInvoice`, body)
    );
    return data;
  }
  public async getCreatedInvoiceList(body: { compid: string | number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: string | number },
        HttpDataResponse<GeneratedInvoice[] | number>
      >(`/api/Invoice/GetchDetails`, body)
    );
    return data;
  }
  public async cancelInvoice(body: AddCancelForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddCancelForm,
        HttpDataResponse<number | GeneratedInvoice>
      >(`/api/Invoice/AddCancel`, body)
    );
    return data;
  }
  public async addAmendment(body: AmendInvoiceForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AmendInvoiceForm,
        HttpDataResponse<number | GeneratedInvoice>
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
  public async addDeliveryCode(body: {
    sno: number | string;
    user_id: number | string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { sno: number | string; user_id: number | string },
        HttpDataResponse<GeneratedInvoice | number>
      >(`/api/Invoice/AddDCode`, body)
    );
    return data;
  }
  public async confirmDeliveryCode(body: {
    code: number | string;
    mobile_no: string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { code: number | string; mobile_no: string },
        HttpDataResponse<number | string>
      >(`/api/Invoice/ConfirmDel`, body)
    );
    return data;
  }
  public async findInvoice(body: { compid: number; inv: number }) {
    let query = `compid=${body.compid}&inv=${body.inv}`;
    let data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<GeneratedInvoice | number>>(
        `/api/Invoice/FindInvoice?${query}`
      )
    );
    return data;
  }
}
