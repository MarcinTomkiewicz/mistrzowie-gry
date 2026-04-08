import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AppRole } from '../types/app-role';
import { hasMinimumRole } from '../utils/roles';
import { Auth } from '../services/auth/auth';

export function minimumRoleGuard(requiredRole: AppRole): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);
    const unauthorizedUrl = router.parseUrl('/not-authorized');

    if (auth.isReady()) {
      return hasMinimumRole(auth.user(), requiredRole) ? true : unauthorizedUrl;
    }

    return auth.loadUser().pipe(
      map((user) => (hasMinimumRole(user, requiredRole) ? true : unauthorizedUrl)),
      catchError(() => of<UrlTree>(unauthorizedUrl)),
    );
  };
}
