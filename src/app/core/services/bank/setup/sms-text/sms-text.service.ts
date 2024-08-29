import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { AddSmsTextForm } from 'src/app/core/models/bank/forms/setup/sms-text/sms-text';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { SmsText } from 'src/app/core/models/bank/setup/sms-text';

@Injectable({
  providedIn: 'root',
})
export class SmsTextService {
  constructor(private client: RequestClientService) {}
  getSmsTextList(body: {}) {
    return this.client.performPost<{}, HttpDataResponse<number | SmsText[]>>(
      `/api/SmsText/GetSmsTextList`,
      body
    );
  }
  insertSmsText(body: AddSmsTextForm) {
    return this.client.performPost<
      AddSmsTextForm,
      HttpDataResponse<SmsText | number>
    >('/api/SmsText/AddSmsText', body);
  }
  findSmsTextById(id: number) {
    return this.client.performGet<HttpDataResponse<SmsText | number>>(
      `/api/SmsText/FindSmsText?sno=${id}`
    );
  }
  removeSmsText(id: number, userid: number) {
    return this.client.performGet<HttpDataResponse<number>>(
      `/api/SmsText/DeleteSmsText?sno=${id}&userid=${userid}`
    );
  }
}
