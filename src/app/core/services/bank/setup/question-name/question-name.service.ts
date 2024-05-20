import { Injectable } from '@angular/core';
import { RequestClientService } from '../../../request-client.service';
import { AddQuestionName } from 'src/app/core/models/bank/forms/setup/question-name/add-question-name';
import { lastValueFrom } from 'rxjs';
import { HttpDataResponse } from 'src/app/core/models/http-data-response';
import { QuestionName } from 'src/app/core/models/bank/setup/question-name';

@Injectable({
  providedIn: 'root',
})
export class QuestionNameService {
  constructor(private client: RequestClientService) {}
  public async addQuestionName(body: AddQuestionName) {
    let data = await lastValueFrom(
      this.client.performPost<AddQuestionName, HttpDataResponse<number>>(
        `/api/Question/Addques`,
        body
      )
    );
    return data;
  }
  public async getQuestionNameList(body: {}) {
    let data = await lastValueFrom(
      this.client.performPost<any, HttpDataResponse<QuestionName[]>>(
        `/api/Question/Getques`,
        body
      )
    );
    return data;
  }
}
