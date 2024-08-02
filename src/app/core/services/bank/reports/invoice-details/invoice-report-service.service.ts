import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import {
  InvoiceReportForm,
  InvoiceReportFormBanker,
  InvoiceReportFormVendor,
} from 'src/app/core/models/vendors/forms/invoice-report-form';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { InvoiceReport } from 'src/app/core/models/bank/reports/invoice-report';

@Injectable({
  providedIn: 'root',
})
export class InvoiceReportServiceService {
  constructor(private client: RequestClientService) {}
  public async getInvoiceReport(
    body: InvoiceReportFormBanker | InvoiceReportFormVendor | InvoiceReportForm
  ) {
    let data = lastValueFrom(
      this.client.performPost<
        InvoiceReportFormBanker | InvoiceReportFormVendor | InvoiceReportForm,
        HttpDataResponse<InvoiceReport[] | number>
      >(`/api/RepCompInvoice/GetInvReport`, body)
    );
    return data;
  }
}
