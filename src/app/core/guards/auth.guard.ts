import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { Auth } from '../services/auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (auth.isReady()) {
    return auth.isAuthenticated() ? true : router.parseUrl('/');
  }

  return auth.loadUser().pipe(
    map((user) => {
      if (user) {
        return true;
      }

      return router.parseUrl('/');
    }),
    catchError(() => of<UrlTree>(router.parseUrl('/'))),
  );
};