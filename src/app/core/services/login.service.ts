import { Injectable } from '@angular/core';
import { RequestClientService } from './request-client.service';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from '../models/http-data-response';
import { ChangePasswordForm } from '../models/auth/change-password-form';
import { ForgotPasswordResponse } from '../models/auth/forgot-password-response';
import {
  BankLoginResponse,
  VendorLoginResponse,
} from '../models/login-response';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private client: RequestClientService) {}
  public async loginUser(body: { uname: string; pwd: string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { uname: string; pwd: string },
        HttpDataResponse<VendorLoginResponse | BankLoginResponse>
      >(`/api/LoginUser/AddLogins`, body)
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
  public async changePassword(body: ChangePasswordForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        ChangePasswordForm,
        HttpDataResponse<string | number>
      >(`/api/Updatepwd/UpdatePwd`, body)
    );
    return data;
  }
  public async forgotPasswordLink(body: { mobile: string }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { mobile: string },
        HttpDataResponse<ForgotPasswordResponse | string | number>
      >(`/api/Forgot/getMobile`, body)
    );
    return data;
  }
  public async sendOtpResetPasswordLink(body: {
    mobile: string;
    otp_code: number | string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { mobile: string; otp_code: number | string },
        HttpDataResponse<string | number>
      >(`/api/Forgot/OtpValidate`, body)
    );
    return data;
  }
  public async forgotPasswordChangePasswordLink(body: {
    mobile: string;
    password: string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { mobile: string; password: string },
        HttpDataResponse<string | number>
      >(`/api/Forgot/ChangePwd`, body)
    );
    return data;
  }
}
