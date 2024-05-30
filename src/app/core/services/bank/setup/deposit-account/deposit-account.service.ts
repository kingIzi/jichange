import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { DepositAccount } from 'src/app/core/models/bank/setup/deposit-account';
import { lastValueFrom } from 'rxjs';
import { AddDepositAccount } from 'src/app/core/models/bank/forms/setup/deposit/add-deposit-account';

@Injectable({
  providedIn: 'root',
})
export class DepositAccountService {
  constructor(private client: RequestClientService) {}
  public async getDepositAccountList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<DepositAccount[] | number>>(
        `/api/DepositA/Getdeposits`,
        body
      )
    );
    return data;
  }
  public async addDepositAccount(body: AddDepositAccount) {
    let data = await lastValueFrom(
      this.client.performPost<AddDepositAccount, HttpDataResponse<number>>(
        `/api/DepositA/AddAccount`,
        body
      )
    );
    return data;
  }
}
