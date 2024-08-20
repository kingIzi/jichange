import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AddCompanyL as AddCompanyLForm } from 'src/app/core/models/bank/forms/company/summary/add-company-l';
import { AddCompany } from 'src/app/core/models/bank/forms/company/summary/add-company';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Company } from 'src/app/core/models/bank/company/company';
import { CompanyUser } from 'src/app/core/models/vendors/company-user';
import { Region } from 'src/app/core/models/bank/setup/region';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  constructor(private client: RequestClientService) {}
  public async checkAccount(body: { acc: string }) {
    let data = await lastValueFrom(
      this.client.performPost<{ acc: string }, HttpDataResponse<boolean>>(
        `/api/company/CheckAccount`,
        body
      )
    );
    return data;
  }
  public async addCompanyL(body: AddCompanyLForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddCompanyLForm,
        HttpDataResponse<number | string | boolean>
      >(`/api/Company/AddCompanyBankL`, body)
    );
    return data;
  }
  public async addCompany(body: AddCompany) {
    let data = await lastValueFrom(
      this.client.performPost<AddCompany, HttpDataResponse<number | Company>>(
        `/api/Company/AddCompanyBank`,
        body
      )
    );
    return data;
  }
  public async getRegionList() {
    let data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<number | string | Region[]>>(
        `/api/Company/GetRegionDetails`
      )
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
    let data = await lastValueFrom(
      this.client.performPost(`/api/Company/getcompanys_S`, body)
    );
    return data as HttpDataResponse<Company[] | number | string>;
  }
  public async postCompanyUsersList(body: { compid: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { compid: number },
        HttpDataResponse<CompanyUser[] | string | number>
      >(`/api/CompanyUsers/GetCompanyUserss`, body)
    );
    return data;
  }
  public async getLatestCompanies(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<
        {},
        HttpDataResponse<string | number | Company[]>
      >(`/api/Setup/LatestComp`, body)
    );
    return data;
  }
  public async getCompanyById(body: { Sno: number | string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { Sno: number | string },
        HttpDataResponse<string | number | Company>
      >(`/api/company/GetDetailsindivi`, body)
    );
    return data;
  }
}
