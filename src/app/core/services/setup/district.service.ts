import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DistrictService {
  constructor(private client: RequestClientService) {}
  public async postDistrictList(body: { Sno: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Company/GetDistDetails`, body)
    );
    return data;
  }
}
