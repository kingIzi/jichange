import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegionService {
  constructor(private client: RequestClientService) {}
  public async getRegionList() {
    let data = await lastValueFrom(
      this.client.performGet(`/api/Company/GetRegionDetails`)
    );
    return data;
  }
}
