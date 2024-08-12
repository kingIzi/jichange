import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const loggedInGuard: CanActivateFn = (route, state) => {
  let userProfile = sessionStorage.getItem('userProfile');
  return userProfile ? true : inject(Router).createUrlTree(['/auth/login']);
};
