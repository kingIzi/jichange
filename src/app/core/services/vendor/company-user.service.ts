import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from '../../models/http-data-response';
import { CompanyUser } from '../../models/vendors/company-user';
import { GetCompanyByIdForm } from '../../models/vendors/forms/get-company-user-by-id-form';

@Injectable({
  providedIn: 'root',
})
export class CompanyUserService {
  constructor(private client: RequestClientService) {}
  public async requestRolesAct(body: { compid: number }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Role/GetRolesAct`, body)
    );
    return data;
  }
  public async requestAddCompanyUser(body: {
    pos: string;
    auname: string;
    uname: string;
    mob: string;
    mail: string;
    userid: number;
    sno: string;
    compid: string;
  }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/CompanyUsers/AddCompanyUser`, body)
    );
    return data;
  }
  public async getCompanyUserByid(body: GetCompanyByIdForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        GetCompanyByIdForm,
        HttpDataResponse<number | string | boolean | CompanyUser>
      >(`/api/CompanyUsers/EditCompanyUserss`, body)
    );
    return data;
  }
}
