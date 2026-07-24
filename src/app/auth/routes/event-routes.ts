import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

const loaders = {
  eventSignup: () =>
    import('../components/event-signup/event-signup').then(
      (m) => m.EventSignup,
    ),
  eventSignupForm: () =>
    import('../components/event-signup-form/event-signup-form').then(
      (m) => m.EventSignupForm,
    ),
} as const;

export const eventRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: loaders.eventSignup,
    canActivate: [authGuard],
  },
  {
    path: ':eventSlug/:occurrenceDate/signup',
    loadComponent: loaders.eventSignupForm,
    canActivate: [authGuard],
  },
];
