import { Injectable } from '@angular/core';
import { RequestClientService } from './request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from '../models/http-data-response';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private client: RequestClientService) {}
  public async loginUser(body: { uname: string; pwd: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/LoginUser/AddLogins`, body)
    );
    return data;
  }
  public async verifyControlNumber(body: { control: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetControl`, body)
    );
    return data;
  }
  public async logout(body: { userid: number | string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { userid: number | string },
        HttpDataResponse<number>
      >(`/api/LoginUser/Logout/Userid=${body.userid}`, body)
    );
    return data;
  }
  public async sendResetPasswordLink(body: { name: string }) {
    let data = await lastValueFrom(
      this.client.performPost<{ name: string }, HttpDataResponse<string>>(
        `/api/Forgot/Getemail`,
        body
      )
    );
    return data;
  }
}
