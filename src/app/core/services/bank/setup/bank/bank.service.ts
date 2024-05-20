import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AddBankUserForm } from 'src/app/core/models/bank/forms/setup/bank-user/add-bank-user-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';

@Injectable({
  providedIn: 'root',
})
export class BankService {
  constructor(private client: RequestClientService) {}
  public async postEmployeeDetails(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<EmployeeDetail[]>>(
        `/api/EmployDet/GetEmpDetails`,
        body
      )
    );
    return data;
  }
  public async postFetchEmployeeDetail(body: { sno: string | number }) {
    let data = await lastValueFrom(
      this.client.performPost<
        { sno: string | number },
        HttpDataResponse<EmployeeDetail>
      >(`/api/EmployDet/GetEmpIndivi`, body)
    );
    return data;
  }
  public async addEmployeeDetail(body: AddBankUserForm) {
    let data = await lastValueFrom(
      this.client.performPost<AddBankUserForm, HttpDataResponse<number>>(
        `/api/EmployDet/AddEmp`,
        body
      )
    );
    return data;
  }
}
