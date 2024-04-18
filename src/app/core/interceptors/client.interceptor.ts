import { HttpInterceptorFn } from '@angular/common/http';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';

export const clientInterceptor: HttpInterceptorFn = (req, next) => {
  const timeoutDuration = 30000;
  return next(req).pipe(
    timeout(timeoutDuration),
    catchError((error) => {
      return throwError(() => error);
    })
  );
};
