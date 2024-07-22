import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { District } from 'src/app/core/models/bank/setup/district';
import { AddDistrictForm } from 'src/app/core/models/bank/forms/setup/district/add-district-form';
import { RemoveDistrictForm } from 'src/app/core/models/bank/forms/setup/district/remove-district-form';

@Injectable({
  providedIn: 'root',
})
export class DistrictService {
  constructor(private client: RequestClientService) {}
  public async getDistrictByRegion(body: { Sno: string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { Sno: string },
        HttpDataResponse<District[] | number | string>
      >(`/api/Company/GetDistDetails`, body)
    );
    return data;
  }
  public async getAllDistrictList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<District[] | number>>(
        `/api/district/GetdIST`,
        body
      )
    );
    return data;
  }
  public async insertDistrict(body: AddDistrictForm) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<number | District>>(
        `/api/District/AddDistrict`,
        body
      )
    );
    return data;
  }
  public async deleteDistrict(body: RemoveDistrictForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        { userid: number | string; sno: number | string },
        HttpDataResponse<number>
      >(`/api/District/DeleteDist`, body)
    );
    return data;
  }
}
