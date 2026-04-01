import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { Auth } from '../services/auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const unauthorizedUrl = router.parseUrl('/not-authorized');

  if (auth.isReady()) {
    return auth.isAuthenticated() ? true : unauthorizedUrl;
  }

  return auth.loadUser().pipe(
    map((user) => {
      if (user) {
        return true;
      }

      return unauthorizedUrl;
    }),
    catchError(() => of<UrlTree>(unauthorizedUrl)),
  );
};
