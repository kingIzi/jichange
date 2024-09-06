import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from '../../models/http-data-response';
import { CompanyUser } from '../../models/vendors/company-user';
import { GetCompanyByIdForm } from '../../models/vendors/forms/get-company-user-by-id-form';
import { RoleAct } from '../../models/vendors/role-act';
import { AddCompanyUserForm } from '../../models/vendors/forms/add-company-user';

@Injectable({
  providedIn: 'root',
})
export class CompanyUserService {
  constructor(private client: RequestClientService) {}
  public async requestRolesAct(body: { compid: number }) {
    const data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<number | RoleAct[]>>(
        `/api/Role/GetRolesAct`
      )
    );
    return data;
  }
  public async requestAddCompanyUser(body: AddCompanyUserForm) {
    const data = await lastValueFrom(
      this.client.performPost<
        AddCompanyUserForm,
        HttpDataResponse<CompanyUser | number>
      >(`/api/CompanyUsers/AddCompanyUser`, body)
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
  public resendCredentials(body: {
    resendCredentials: string;
    companyUserId: number;
  }) {
    return this.client.performPost<
      {
        resendCredentials: string;
        companyUserId: number;
      },
      HttpDataResponse<number | CompanyUser>
    >(`/api/CompanyUsers/ResendCredentials`, body);
  }
  public getCompanyUsersById(body: { Sno: number }) {
    return this.client.performPost<
      { Sno: number },
      HttpDataResponse<number | CompanyUser>
    >(`/api/CompanyUsers/EditCompanyUserss`, body);
  }
}
