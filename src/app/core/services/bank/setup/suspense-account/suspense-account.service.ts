import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { SuspenseAccount } from 'src/app/core/models/bank/setup/suspense-account';
import { AddSuspenseAccountForm } from 'src/app/core/models/bank/forms/setup/suspense-account/add-suspense-account-form';
import { DeleteSuspenseAccountForm } from 'src/app/core/models/bank/forms/setup/suspense-account/delete-suspense-account-form';

@Injectable({
  providedIn: 'root',
})
export class SuspenseAccountService {
  constructor(private client: RequestClientService) {}
  public async getSuspenseAccountList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<
        any,
        HttpDataResponse<SuspenseAccount[] | number>
      >(`/api/SuspenseA/GetAccount`, body)
    );
    return data;
  }
  public async addSuspenseAccount(form: AddSuspenseAccountForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddSuspenseAccountForm,
        HttpDataResponse<number | SuspenseAccount>
      >(`/api/SuspenseA/AddAccount`, form)
    );
    return data;
  }
  public async getSuspenseActiveAccountList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<SuspenseAccount[] | number>>(
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
  public async DeleteSuspenseAccountForm(body: DeleteSuspenseAccountForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        DeleteSuspenseAccountForm,
        HttpDataResponse<number>
      >(`/api/SuspenseA/DeleteAccount`, body)
    );
    return data;
  }
}
