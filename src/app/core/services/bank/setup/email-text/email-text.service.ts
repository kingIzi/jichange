import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { EmailText } from 'src/app/core/models/bank/setup/email-text';
import { AddEmailTextForm } from 'src/app/core/models/bank/forms/setup/email-text/add-email-text-form';
import { RemoveEmailTextForm } from 'src/app/core/models/bank/forms/setup/email-text/remove-email-text-form';

@Injectable({
  providedIn: 'root',
})
export class EmailTextService {
  constructor(private client: RequestClientService) {}
  public async getAllEmailTextList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<
        {},
        HttpDataResponse<EmailText[] | number | string>
      >(`/api/Email/GetEmailDetails`, body)
    );
    return data;
  }
  public async insertEmailText(body: AddEmailTextForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddEmailTextForm,
        HttpDataResponse<number | string | boolean>
      >(`/api/Email/AddEmail`, body)
    );
    return data;
  }
  public async deleteEmailText(body: RemoveEmailTextForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        RemoveEmailTextForm,
        HttpDataResponse<number | string | boolean>
      >(`/api/Email/DeleteEmail`, body)
    );
    return data;
  }
}
