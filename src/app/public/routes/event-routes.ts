import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

const loaders = {
  calendarPreview: () =>
    import(
      '../components/universal-calendar-preview/universal-calendar-preview'
    ).then((m) => m.UniversalCalendarPreview),
  chaoticThursdays: () =>
    import('../components/chaotic-thursdays/chaotic-thursdays').then(
      (m) => m.ChaoticThursdays,
    ),
  sessionReservation: () =>
    import('../components/session-reservation/session-reservation').then(
      (m) => m.SessionReservation,
    ),
} as const;

export const eventRoutes: Routes = [
  {
    path: 'preview/universal-calendar',
    loadComponent: loaders.calendarPreview,
  },
  {
    path: 'chaotic-thursdays',
    loadComponent: loaders.chaoticThursdays,
  },
  {
    path: 'rezerwacja-sesji',
    loadComponent: loaders.sessionReservation,
    canActivate: [authGuard],
  },
];
