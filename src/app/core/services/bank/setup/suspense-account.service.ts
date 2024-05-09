import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SuspenseAccountService {
  constructor(private client: RequestClientService) {}
  public async getSuspenseAccountList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/SuspenseA/GetAccount`, body)
    );
    return data;
  }
  public async addSuspenseAccount(form: {
    account: string;
    status: string;
    sno: number;
    userid: number;
  }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/SuspenseA/AddAccount`, form)
    );
    return data;
  }
  public async getSuspenseActiveAccountList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/SuspenseA/GetAccount_Active`, body)
    );
    return data;
  }
}
