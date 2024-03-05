import { Injectable } from '@angular/core';
import { RequestClientService } from './request-client.service';

@Injectable({
  providedIn: 'root',
})
export class LoginService extends RequestClientService {
  getBranchDetails(url: string = '/EMPLOYDET/GetBranchDetails') {
    // return this.performGet(url).subscribe({
    //   next: (result) => {
    //     console.log(result);
    //     return result;
    //   },
    //   error: (err) => {
    //     throw err;
    //   },
    // });
  }
}
