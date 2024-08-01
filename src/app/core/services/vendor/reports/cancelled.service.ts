import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { CancelledInvoiceForm } from 'src/app/core/models/vendors/forms/cancelled-invoice-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { CancelledInvoice } from 'src/app/core/models/vendors/cancelled-invoice';

@Injectable({
  providedIn: 'root',
})
export class CancelledService {
  constructor(private client: RequestClientService) {}
  public async getPaymentReport(body: CancelledInvoiceForm) {
    const data = await lastValueFrom(
      this.client.performPost<
        CancelledInvoiceForm,
        HttpDataResponse<CancelledInvoice[] | number>
      >(`/api/Invoice/GetCancelReport`, body)
    );
    return data;
  }
}
