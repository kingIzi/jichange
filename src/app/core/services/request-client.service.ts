import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RequestClientService {
  constructor(private http: HttpClient) {}

  private get<T>(url: string): Observable<T> {
    if (url) {
      return this.http.get<T>(environment.baseUrl + url);
    }
    throw Error('Url is empty');
  }

  private post<T, V>(url: string, payload: T): Observable<V> {
    return this.http.post<V>(environment.baseUrl + url, payload);
  }

  public performGet<T>(url: string) {
    return this.get(url).pipe(
      map((result) => {
        return result;
      }),
      catchError((err: HttpErrorResponse) => {
        throw err;
      })
    );
  }

  public performPost<T>(url: string, payload: T) {
    return this.post(url, payload).pipe(
      map((result) => {
        return result;
      }),
      catchError((err: HttpErrorResponse) => {
        throw err;
      })
    );
  }
}