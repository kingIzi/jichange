import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { lastValueFrom } from 'rxjs';
import { Branch } from '../../../../models/bank/setup/branch';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor(private client: RequestClientService) {}
  public async postBranchList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Branch/GetBranchLists`, body)
    );
    return data;
  }
  public async removeBranch(sno: number) {
    let data = await lastValueFrom(
      this.client.performPost(`/api/Branch/DeleteBranch?sno=${sno}`, {})
    );
    return data;
  }
}
