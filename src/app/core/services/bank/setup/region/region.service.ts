import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Region } from 'src/app/core/models/bank/setup/region';
import { AddRegionForm } from 'src/app/core/models/bank/forms/setup/region/add-region-form';

@Injectable({
  providedIn: 'root',
})
export class RegionService {
  constructor(private client: RequestClientService) {}
  public async getRegionList() {
    let data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<Region[] | number | string>>(
        `/api/Company/GetRegionDetails`
      )
    );
    return data;
  }
  public async getAllRegionsList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<Region[] | number>>(
        `/api/Region/GetRegionDetails`,
        body
      )
    );
    return data;
  }
  public async deleteRegion(body: { sno: number; userid: number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { sno: number; userid: number },
        HttpDataResponse<number>
      >(`/api/Region/DeleteRegion`, body)
    );
    return data;
  }
  public async addRegion(body: AddRegionForm) {
    let data = await lastValueFrom(
      this.client.performPost<AddRegionForm, HttpDataResponse<number | Region>>(
        `/api/Region/AddRegion`,
        body
      )
    );
    return data;
  }
}
