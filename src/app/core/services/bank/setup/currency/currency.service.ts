import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Currency } from 'src/app/core/models/bank/setup/currency';
import { AddCurrency } from 'src/app/core/models/bank/forms/setup/currency/add-currency';
import { RemoveCurrencyForm } from 'src/app/core/models/bank/forms/setup/currency/remove-currency-form';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  constructor(private client: RequestClientService) {}
  public async getCurrencyList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<Currency[] | number>>(
        `/api/Currency/GetCurrencyDetails`,
        body
      )
    );
    return data;
  }
  public async addCurrency(body: AddCurrency) {
    let data = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<number | Currency>>(
        `/api/Currency/AddCurrency`,
        body
      )
    );
    return data;
  }
  public async deleteCurrency(body: RemoveCurrencyForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        RemoveCurrencyForm,
        HttpDataResponse<string | number>
      >(`/api/Currency/Deletecurrency`, body)
    );
    return data;
  }
}
