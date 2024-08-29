import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  SmsSetting,
  SmsSettingsData,
} from 'src/app/core/models/bank/setup/sms-setting';
import { lastValueFrom } from 'rxjs';
import { SMSSettingsForm } from 'src/app/core/models/bank/forms/setup/sms-settings/sms-settings';

@Injectable({
  providedIn: 'root',
})
export class SmsSettingsService {
  constructor(private client: RequestClientService) {}
  public getSmsSettingsList(body: {}) {
    return this.client.performPost<
      {},
      HttpDataResponse<number | SmsSettingsData[]>
    >(`/api/SMSSETTING/GetSMTPDetails`, body);
  }
  public insertSmsSetting(body: SMSSettingsForm) {
    return this.client.performPost<
      SMSSettingsForm,
      HttpDataResponse<number | SmsSettingsData>
    >(`/api/SMSSETTING/AddSMTP`, body);
  }
  public findSmsSecurityById(id: number) {
    return this.client.performGet<HttpDataResponse<number | SmsSettingsData>>(
      `/api/SMSSETTING/FindSmsSetting?sno=${id}`
    );
  }
  public removeSmsSecurityById(id: number, userid: number) {
    return this.client.performGet<HttpDataResponse<number>>(
      `/api/SMSSETTING/DeleteSMTP?sno=${id}&userid=${userid}`
    );
  }
}
