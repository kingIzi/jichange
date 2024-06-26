import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { Branch } from '../../../../models/bank/setup/branch';
import { AddBranchForm } from 'src/app/core/models/bank/forms/setup/branch/add-branch-form';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor(private client: RequestClientService) {}
  public async postBranchList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<{}, HttpDataResponse<Branch[] | number | string>>(
        `/api/Branch/GetBranchLists`,
        body
      )
    );
    return data;
  }
  public async removeBranch(sno: number) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Branch/DeleteBranch?sno=${sno}`, {})
    );
    return data;
  }
  public async addBranch(body: AddBranchForm) {
    let data = await lastValueFrom(
      this.client.performPost<
        AddBranchForm,
        HttpDataResponse<number | string | boolean>
      >(`/api/Branch/AddBranch`, body)
    );
    return data;
  }
}
