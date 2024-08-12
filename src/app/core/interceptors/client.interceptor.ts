import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { inject } from '@angular/core';
import { AppConfigService } from '../services/app-config.service';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { TranslocoService } from '@ngneat/transloco';

// export const clientInterceptor: HttpInterceptorFn = (req, next) => {
//   let appConfig = inject(AppConfigService);
//   let timeoutDuration = 30000;
//   if (req.url.includes('AddLogins')) {
//     return next(req).pipe(
//       timeout(timeoutDuration),
//       catchError((error) => {
//         return throwError(() => error);
//       })
//     );
//   }
//   let token = appConfig.getJwtTokenFromLocalStorage();
//   let authReq = req.clone({
//     headers: req.headers.set('Authorization', `Bearer ${token}`),
//   });
//   return next(authReq).pipe(
//     timeout(timeoutDuration),
//     catchError((error) => {
//       return throwError(() => error);
//     })
//   );
// };

function handleUnauthorizedUser(
  appConfig: AppConfigService,
  router: Router,
  tr: TranslocoService
) {
  let title = tr.translate('errors.accessDenied');
  let message = tr.translate('errors.unAuthorizedUser');
  let dialogRef = appConfig.openDisabledCloseMessageDialog(title, message);
  dialogRef.componentInstance.ok.asObservable().subscribe(() => {
    dialogRef.close();
  });
  dialogRef.afterClosed().subscribe(() => {
    router.navigate(['/auth']).then((e) => {
      location.reload();
    });
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let appConfig = inject(AppConfigService);
  if (req.url.includes('AddLogins') || req.url.includes('/assets/i18n/')) {
    return next(req);
  }
  let token = appConfig.getJwtTokenFromSessionStorage();
  let authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(authReq);
};

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  let timeoutDuration = 30000;
  let appConfig = inject(AppConfigService);
  let router = inject(Router);
  let login = inject(LoginService);
  let tr = inject(TranslocoService);
  return next(req).pipe(
    timeout(timeoutDuration),
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 && appConfig.getLoginResponse()) {
          login
            .logout({ userid: appConfig.getUserIdFromSessionStorage() })
            .then((result) => {
              handleUnauthorizedUser(appConfig, router, tr);
            })
            .catch((err) => {
              throw err;
            });
        } else {
          return throwError(() => err);
        }
      }
      return throwError(() => err);
    })
  );
};
