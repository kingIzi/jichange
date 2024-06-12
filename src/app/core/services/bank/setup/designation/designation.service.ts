import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { RemoveDesignationForm } from 'src/app/core/models/bank/forms/setup/designation/remove-designation-form';
import { Designation } from 'src/app/core/models/bank/setup/designation';

@Injectable({
  providedIn: 'root',
})
export class DesignationService {
  constructor(private client: RequestClientService) {}
  public async getDesignationList() {
    let data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<Designation[] | number | string>>(
        `/api/EmployDet/GetdesgDetails`
      )
    );
    return data;
  }
  public async addDesignation(form: {
    desg: string;
    sno: number;
    userid: number;
    dummy: boolean;
  }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Designation/Adddesg`, form)
    );
    return data;
  }
  public async deleteDesignation(body: {
    sno: number | string;
    userid: number | string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        RemoveDesignationForm,
        HttpDataResponse<number | string>
      >(`/api/Designation/Deletedesg`, body)
    );
    return data;
  }
}
