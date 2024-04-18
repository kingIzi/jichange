import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BankService {
  constructor(private client: RequestClientService) {}
  public async postEmployeeDetails(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/EmployDet/GetEmpDetails`, body)
    );
    return data;
  }
  public async postFetchEmployeeDetail(body: { sno: string }) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/EmployDet/GetEmpIndivi`, body)
    );
    return data;
  }
}
