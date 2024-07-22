import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Ward } from 'src/app/core/models/bank/setup/ward';
import { AddWardForm } from 'src/app/core/models/bank/forms/setup/ward/AddWardForm';
import { RemoveWardForm } from 'src/app/core/models/bank/forms/setup/ward/RemoveWard';

@Injectable({
  providedIn: 'root',
})
export class WardService {
  constructor(private client: RequestClientService) {}
  public async postWardList(sno: string) {
    let wards = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<Ward[] | number | string>>(
        `/api/Company/GetWard?sno=${sno}`,
        {}
      )
    );
    return wards;
  }
  public async getAllWardsList(body: {}) {
    let wards = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<Ward[] | number>>(
        `/api/Ward/GetWard`,
        body
      )
    );
    return wards;
  }
  public async insertWard(body: AddWardForm) {
    let data = await lastValueFrom(
      this.client.performPost<AddWardForm, HttpDataResponse<number | Ward>>(
        `/api/Ward/AddWard`,
        body
      )
    );
    return data;
  }
  public async deleteWard(body: RemoveWardForm) {
    let data = await lastValueFrom(
      this.client.performPost<RemoveWardForm, HttpDataResponse<number>>(
        `/api/Ward/DeleteWard`,
        body
      )
    );
    return data;
  }
}
