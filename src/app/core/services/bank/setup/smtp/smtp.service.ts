import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { SMTP } from 'src/app/core/models/bank/setup/smtp';
import { AddSmtpForm } from 'src/app/core/models/bank/forms/setup/smtp/add-smtp';
import { RemoveSmtpForm } from 'src/app/core/models/bank/forms/setup/smtp/remove-smtp';

@Injectable({
  providedIn: 'root',
})
export class SmtpService {
  constructor(private client: RequestClientService) {}
  public async getAllSmtpList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<SMTP[] | number>>(
        `/api/SMTP/GetSmtpDetails`,
        body
      )
    );
    return data;
  }
  public async insertSmtp(body: AddSmtpForm) {
    let data = await lastValueFrom(
      this.client.performPost<AddSmtpForm, HttpDataResponse<number | SMTP>>(
        `/api/SMTP/AddSMTP`,
        body
      )
    );
    return data;
  }
  public async deleteSmtp(body: RemoveSmtpForm) {
    let data = await lastValueFrom(
      this.client.performPost<RemoveSmtpForm, HttpDataResponse<number>>(
        `/api/SMTP/DeleteSMTP`,
        body
      )
    );
    return data;
  }
}
