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
    return this.http.get<T>(environment.baseUrl + url);
  }

  private post<T, V>(url: string, payload: T): Observable<V> {
    return this.http.post<V>(environment.baseUrl + url, payload);
  }

  private postChat<T, V>(url: string, payload: T): Observable<V> {
    return this.http.post<V>(`http://127.0.0.1:5000${url}`, payload);
  }

  public performGet<T>(url: string) {
    return this.get(url).pipe(
      map((result) => {
        return result as T;
      })
    );
  }

  public performPost<T, V>(url: string, payload: T) {
    return this.post(url, payload).pipe(
      map((result) => {
        return result as V;
      })
    );
  }

  public performPostChat<T>(url: string, payload: T) {
    return this.postChat(url, payload).pipe(
      map((result) => {
        return result;
      }),
      catchError((err: HttpErrorResponse) => {
        throw err;
      })
    );
  }
}
