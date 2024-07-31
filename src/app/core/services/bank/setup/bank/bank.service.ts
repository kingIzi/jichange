import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { AddBankUserForm } from 'src/app/core/models/bank/forms/setup/bank-user/add-bank-user-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { EmployeeDetail } from 'src/app/core/models/bank/setup/employee-detail';
import { DeleteBankUserForm } from 'src/app/core/models/bank/forms/setup/bank-user/delete-bank-user-form';

@Injectable({
  providedIn: 'root',
})
export class BankService {
  constructor(private client: RequestClientService) {}
  public async postEmployeeDetails(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<EmployeeDetail[] | number>>(
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
        HttpDataResponse<EmployeeDetail | number>
      >(`/api/EmployDet/GetEmpIndivi`, body)
    );
    return data;
  }
  public async addEmployeeDetail(body: AddBankUserForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddBankUserForm,
        HttpDataResponse<number | EmployeeDetail>
      >(`/api/EmployDet/AddEmp`, body)
    );
    return data;
  }
  public async deleteEmployeeDetail(body: DeleteBankUserForm) {
    let data = await lastValueFrom(
      this.client.performPost<DeleteBankUserForm, HttpDataResponse<number>>(
        `/api/EmployDet/DeleteEmployee`,
        body
      )
    );
    return data;
  }
}
