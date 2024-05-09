import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AddCompanyL } from 'src/app/core/models/bank/forms/add-company-l';
import { AddCompany } from 'src/app/core/models/bank/forms/add-company';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private client: RequestClientService) {}
  public async checkAccount(acc: string) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/company/CheckAccount`, { acc: acc })
    );
    return data;
  }
  public async addCompanyL(body: AddCompanyL) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Company/AddCompanyBankL`, body)
    );
    return data;
  }
  public async addCompany(body: AddCompany) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Company/AddCompanyBank`, body)
    );
    return data;
  }
  public async getRegionList() {
    let data = await lastValueFrom(
      this.client.performGet(`/api/Company/GetRegionDetails`)
    );
    return data;
  }
  public async getDistrictList(body: { Sno: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Company/GetDistDetails`, body)
    );
    return data;
  }
  public async getCustomersList(body: {}) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Company/getcompanys_S`, body)
    );
    return data;
  }
  public async postCompanyInboxList(body: { design: string; braid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/CompanyInbox/Getcompanys`, body)
    );
    return data;
  }
  public async postCompanyUsersList(body: { compid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/CompanyUsers/GetCompanyUserss`, body)
    );
    return data;
  }
  public async approveCompany(body: {
    compsno: number;
    pfx: string;
    ssno: string;
    userid: number;
  }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/CompanyInbox/AddCompanyBank`, body)
    );
    return data;
  }
}
