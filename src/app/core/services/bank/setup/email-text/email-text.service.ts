import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  EmailText,
  EmailTextFlow,
} from 'src/app/core/models/bank/setup/email-text';
import { AddEmailTextForm } from 'src/app/core/models/bank/forms/setup/email-text/add-email-text-form';
import { RemoveEmailTextForm } from 'src/app/core/models/bank/forms/setup/email-text/remove-email-text-form';

@Injectable({
  providedIn: 'root',
})
export class EmailTextService {
  constructor(private client: RequestClientService) {}
  public async getAllEmailTextList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<EmailText[] | number>>(
        `/api/Email/GetEmailDetails`,
        body
      )
    );
    return data;
  }
  public async insertEmailText(body: AddEmailTextForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddEmailTextForm,
        HttpDataResponse<number | EmailText>
      >(`/api/Email/AddEmail`, body)
    );
    return data;
  }
  public async deleteEmailText(body: RemoveEmailTextForm) {
    let data = await lastValueFrom(
      this.client.performPost<RemoveEmailTextForm, HttpDataResponse<number>>(
        `/api/Email/DeleteEmail`,
        body
      )
    );
    return data;
  }
  public async getFlows() {
    let data = await lastValueFrom(
      this.client.performGet<HttpDataResponse<number | EmailTextFlow[]>>(
        `/api/Email/GetFlows`
      )
    );
    return data;
  }
}
