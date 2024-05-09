import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WardService {
  constructor(private client: RequestClientService) {}
  public async postWardList(sno: string) {
    let wards = await lastValueFrom(
      this.client.performPost(`/api/Company/GetWard?sno=${sno}`, {})
    );
    return wards;
  }
}
