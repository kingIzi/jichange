import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AuditTrailsReportForm } from 'src/app/core/models/bank/forms/reports/audit-trails-report-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { AuditTrail } from 'src/app/core/models/bank/reports/auditTrail';

@Injectable({
  providedIn: 'root',
})
export class AuditTrailsService {
  constructor(private client: RequestClientService) {}
  public async getDetails(body: AuditTrailsReportForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AuditTrailsReportForm,
        HttpDataResponse<number | string | AuditTrail[]>
      >(`/api/AuditTrail/getdet`, body)
    );
    return data;
  }
}
