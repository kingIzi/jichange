import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CancelledService {
  constructor(private client: RequestClientService) {}
  public async getPaymentReport(body: {
    compid: number;
    cust: string;
    stdate: string;
    enddate: string;
    invno: string;
  }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetCancelReport`, body)
    );
    return data;
  }
}
