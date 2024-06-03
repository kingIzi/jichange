import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { AddCustomerForm } from 'src/app/core/models/vendors/forms/add-customer-form';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Customer } from 'src/app/core/models/vendors/customer';
import { CustomerReportForm } from 'src/app/core/models/vendors/forms/customer-report-form';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(private client: RequestClientService) {}
  public async addCustomer(body: AddCustomerForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddCustomerForm,
        HttpDataResponse<number | string | boolean>
      >(`/api/Customer/AddCustomer`, body)
    );
    return data;
  }
  public async deleteCustomer(body: { sno: number | string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { sno: number | string },
        HttpDataResponse<number | string | boolean>
      >(`/api/Customer/DeleteCust`, body)
    );
    return data;
  }
  public async getCustomersList(body: CustomerReportForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        CustomerReportForm,
        HttpDataResponse<Customer[] | string | number>
      >(`/api/RepCustomer/getcustdetreport`, body)
    );
    return data;
  }
  public async getCustomerById(body: {
    compid: number | string;
    Sno: number | string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: number | string; Sno: number | string },
        HttpDataResponse<number | string | Customer>
      >(`/api/Customer/GetCustbyID`, body)
    );
    return data;
  }
}
