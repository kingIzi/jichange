import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { SuspenseAccount } from 'src/app/core/models/bank/setup/suspense-account';

@Injectable({
  providedIn: 'root',
})
export class SuspenseAccountService {
  constructor(private client: RequestClientService) {}
  public async getSuspenseAccountList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<SuspenseAccount[]>>(
        `/api/SuspenseA/GetAccount`,
        body
      )
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
      this.client.performPost<{}, HttpDataResponse<SuspenseAccount[]>>(
        `/api/SuspenseA/GetAccount_Active`,
        body
      )
    );
    return data;
  }
  public async getAvailableSuspenseAccounts(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<
        {},
        HttpDataResponse<SuspenseAccount[] | number | string>
      >(`/api/SuspenseA/GetAccount_MapActive`, body)
    );
    return data;
  }
}
