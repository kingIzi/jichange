import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AmendmentsService {
  constructor(private client: RequestClientService) {}
  public async getAmendmentsReport(body: {
    compid: number;
    cust: string;
    stdate: string;
    enddate: string;
    invno: string;
  }) {
    const data = await lastValueFrom(
      this.client.performPost(`/api/Invoice/GetPaymentReport`, body)
    );
    return data;
  }
}
