import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';
import {
  InvoiceDetailsForm,
  PaymentDetailReportForm,
} from 'src/app/core/models/vendors/forms/payment-report-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { PaymentDetail } from 'src/app/core/models/vendors/payment-detail';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  constructor(private client: RequestClientService) {}
  public async getPaymentReport(
    body: PaymentDetailReportForm | InvoiceDetailsForm
  ) {
    let data = await lastValueFrom(
      this.client.performPost<
        PaymentDetailReportForm | InvoiceDetailsForm,
        HttpDataResponse<number | PaymentDetail[]>
      >(`/api/Invoice/GetPaymentReport`, body)
    );
    return data;
  }
}
