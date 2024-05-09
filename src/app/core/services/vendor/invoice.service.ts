import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AddInvoiceForm } from '../../models/vendors/forms/add-invoice-form';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  constructor(private client: RequestClientService) {}
  public async postSignedDetails(body: { compid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetSignedDetails`, body)
    );
    return data;
  }
  public async invoiceDetailsById(body: { compid: number; invid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/invoice/GetInvoiceDetailsbyid`, body)
    );
    return data;
  }
  public async invoiceItemDetails(body: { invid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetInvoiceInvoicedetails`, body)
    );
    return data;
  }
  public async getInvoiceCustomerNames(body: { compid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetCustomersS`, body)
    );
    return data;
  }
  public async getCurrencyCodes() {
    const data = await lastValueFrom(
      this.client.performGet(`/api/Invoice/GetCurrency`)
    );
    return data;
  }
  public async getCompanyS(body: { compid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetCompanyS`, body)
    );
    return data;
  }
  public async addInvoice(body: AddInvoiceForm) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/AddInvoice`, body)
    );
    return data;
  }
}
