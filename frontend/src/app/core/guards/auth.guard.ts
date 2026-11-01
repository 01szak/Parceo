import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {SessionService} from '@core/services/SessionService';

export const LOGIN_PATH = 'logowanie';
export const HOME_PATH = 'dzis';

//pages of the panel: without a valid token go to the login page and come back afterwards
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  if (session.isAuthenticated()) return true;
  session.clear();
  return inject(Router).createUrlTree([LOGIN_PATH], {queryParams: {powrot: state.url}});
};

//the login page: a logged in user goes straight to the panel
export const guestGuard: CanActivateFn = () => {
  if (!inject(SessionService).isAuthenticated()) return true;
  return inject(Router).createUrlTree([HOME_PATH]);
};
