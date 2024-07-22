import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { lastValueFrom } from 'rxjs';
import { AddCountryForm } from 'src/app/core/models/bank/forms/setup/country/add-country-form';
import { Country } from 'src/app/core/models/bank/setup/country';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  constructor(private client: RequestClientService) {}
  public async deleteCountry(body: {
    sno: number | string;
    userid: number | string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        {
          sno: number | string;
          userid: number | string;
        },
        HttpDataResponse<number>
      >(`/api/Country/DeleteCount`, body)
    );
    return data;
  }
  public async addCountry(body: AddCountryForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddCountryForm,
        HttpDataResponse<number | Country>
      >(`/api/Country/AddCountry`, body)
    );
    return data;
  }
  public async getCountryList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<Country[] | number>>(
        `/api/Country/getCountries`,
        body
      )
    );
    return data;
  }
}
