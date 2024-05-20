import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuditTrailsService {
  constructor(private client: RequestClientService) {}
  public async getDetails(body: {
    tbname: string;
    Startdate: string;
    Enddate: string;
    act: string;
  }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/AuditTrail/getdet`, body)
    );
    return data;
  }
}
