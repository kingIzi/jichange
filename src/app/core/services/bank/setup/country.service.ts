import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  constructor(private client: RequestClientService) {}
  public async deleteCountry(body: { sno: number; userid: number }) {
    let data = await this.client.performPost(`/api/Country/DeleteCount`, body);
    return data;
  }
  public async addCountry(body: {
    country_name: string;
    dummy: boolean;
    sno: number;
    Auditby: string;
  }) {
    let data = await this.client.performPost(`/api/Country/AddCountry`, body);
    return data;
  }
  public async getCountryList(body: {}) {
    let data = await this.client.performPost(`/api/Country/getCountries`, body);
    return data;
  }
}
