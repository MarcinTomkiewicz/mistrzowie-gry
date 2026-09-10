import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

export const sessionReservationRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('../components/session-reservation/session-reservation').then(
        (m) => m.SessionReservation,
      ),
  },
];
