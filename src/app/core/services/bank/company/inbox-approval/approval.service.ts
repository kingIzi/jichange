import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { CompanyInboxListForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-inbox-list-form';
import { CompanyApprovalForm } from 'src/app/core/models/bank/forms/company/inbox-approval/company-approval-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { Company } from 'src/app/core/models/bank/company/company';

@Injectable({
  providedIn: 'root',
})
export class ApprovalService {
  constructor(private client: RequestClientService) {}
  public async postCompanyInboxList(body: CompanyInboxListForm) {
    const data = await lastValueFrom(
      this.client.performPost<
        CompanyInboxListForm,
        HttpDataResponse<Company[] | number>
      >(`/api/CompanyInbox/Getcompanys`, body)
    );
    return data;
  }
  public async approveCompany(body: CompanyApprovalForm) {
    const data = await lastValueFrom(
      this.client.performPost<
        CompanyApprovalForm,
        HttpDataResponse<Company | number>
      >(`/api/CompanyInbox/AddCompanyBank`, body)
    );
    return data;
  }
}
