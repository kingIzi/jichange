import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AuditTrailsReportForm } from 'src/app/core/models/bank/forms/reports/audit-trails-report-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import {
  AuditTrail,
  AuditTrailLogData,
  ResultsSet,
} from 'src/app/core/models/bank/reports/auditTrail';

@Injectable({
  providedIn: 'root',
})
export class AuditTrailsService {
  constructor(private client: RequestClientService) {}
  public async getDetails(body: AuditTrailsReportForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AuditTrailsReportForm,
        HttpDataResponse<number | ResultsSet>
      >(`/api/AuditTrail/report`, body)
    );
    return data;
  }

  public getAuditReport(body: AuditTrailsReportForm) {
    return this.client.performPost<
      AuditTrailsReportForm,
      HttpDataResponse<number | ResultsSet>
    >(`/api/AuditTrail/report`, body);
  }

  public getTableNames(body: { userid: number }) {
    return this.client.performGet<HttpDataResponse<number | string[]>>(
      `/api/AuditTrail/GetAvailablePages?userid=${body.userid}`
    );
  }
  public getAuditTypes(body: { userid: number }) {
    return this.client.performGet<HttpDataResponse<number | string[]>>(
      `/api/AuditTrail/GetAvailableAuditTypes?userid=${body.userid}`
    );
  }
}
