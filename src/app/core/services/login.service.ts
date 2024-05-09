import { Injectable } from '@angular/core';
import { RequestClientService } from './request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  constructor(private client: RequestClientService) {}
  public async loginUser(body: { uname: string; pwd: string }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/LoginUser/AddLogins`, body)
    );
    return data;
  }
  public async verifyControlNumber(body: { control: string }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetControl`, body)
    );
    return data;
  }
}
