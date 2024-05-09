import { Injectable } from '@angular/core';
import { RequestClientService } from '../../request-client.service';

@Injectable({
  providedIn: 'root',
})
export class DepositAccountService {
  constructor(private client: RequestClientService) {}
}
