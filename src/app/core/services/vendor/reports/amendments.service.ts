import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AmendmentReportForm } from 'src/app/core/models/vendors/forms/amendment-report-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { GeneratedInvoice } from 'src/app/core/models/vendors/generated-invoice';

@Injectable({
  providedIn: 'root',
})
export class AmendmentsService {
  constructor(private client: RequestClientService) {}
  public async getAmendmentsReport(body: AmendmentReportForm) {
    const data = await lastValueFrom(
      this.client.performPost<
        AmendmentReportForm,
        HttpDataResponse<GeneratedInvoice[] | number>
      >(`/api/Invoice/GetAmendReport`, body)
    );
    return data;
  }
}
