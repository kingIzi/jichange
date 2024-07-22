import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { RemoveDesignationForm } from 'src/app/core/models/bank/forms/setup/designation/remove-designation-form';
import { Designation } from 'src/app/core/models/bank/setup/designation';
import { AddDesignationForm } from 'src/app/core/models/bank/forms/setup/designation/add-designation-form';

@Injectable({
  providedIn: 'root',
})
export class DesignationService {
  constructor(private client: RequestClientService) {}
  public async getDesignationList(body: {} = {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<Designation[] | number>>(
        `/api/Designation/GetdesgDetails`,
        body
      )
    );
    return data;
  }
  public async addDesignation(form: AddDesignationForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddDesignationForm,
        HttpDataResponse<number | Designation>
      >(`/api/Designation/Adddesg`, form)
    );
    return data;
  }
  public async deleteDesignation(body: {
    sno: number | string;
    userid: number | string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<RemoveDesignationForm, HttpDataResponse<number>>(
        `/api/Designation/Deletedesg`,
        body
      )
    );
    return data;
  }
}
