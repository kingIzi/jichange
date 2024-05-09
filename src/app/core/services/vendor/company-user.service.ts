import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';

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
  public async requestAddRolesAct(body: {
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
}
