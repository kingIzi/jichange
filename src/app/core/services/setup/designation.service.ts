import { Injectable } from '@angular/core';
import { RequestClientService } from '../request-client.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DesignationService {
  constructor(private client: RequestClientService) {}
  public async getDesignationList() {
    let data = await lastValueFrom(
      this.client.performGet(`/api/EmployDet/GetdesgDetails`)
    );
    return data;
  }
}
