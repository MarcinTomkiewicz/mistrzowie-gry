import type { Routes } from '@angular/router';

const loaders = {
  eventPage: () =>
    import('../components/event-page/event-page').then((m) => m.EventPage),
  calendarPreview: () =>
    import(
      '../components/universal-calendar-preview/universal-calendar-preview'
    ).then((m) => m.UniversalCalendarPreview),
  chaoticThursdays: () =>
    import('../components/chaotic-thursdays/chaotic-thursdays').then(
      (m) => m.ChaoticThursdays,
    ),
} as const;

export const eventRoutes: Routes = [
  {
    path: 'wydarzenia/:eventKey/:editionSlug',
    loadComponent: loaders.eventPage,
  },
  {
    path: 'wydarzenia/:eventKey',
    loadComponent: loaders.eventPage,
  },
  {
    path: 'preview/universal-calendar',
    loadComponent: loaders.calendarPreview,
  },
  {
    path: 'chaotic-thursdays',
    pathMatch: 'full',
    redirectTo: 'chaotyczne-czwartki',
  },
  {
    path: 'chaotyczne-czwartki',
    loadComponent: loaders.chaoticThursdays,
  },
  {
    path: 'rezerwacja-sesji',
    loadChildren: () =>
      import('./session-reservation-routes').then(
        (m) => m.sessionReservationRoutes,
      ),
  },
];
