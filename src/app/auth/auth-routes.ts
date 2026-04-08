import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { minimumRoleGuard } from '../core/guards/minimum-role.guard';

const loaders = {
  // login: () => import('./components/login/login').then((m) => m.Login),
  register: () =>
    import('./components/register/register').then((m) => m.Register),
  editProfile: () =>
    import('./components/edit-profile/edit-profile').then((m) => m.EditProfile),
  eventSignup: () =>
    import('./components/event-signup/event-signup').then(
      (m) => m.EventSignupComponent,
    ),
  eventSignupForm: () =>
    import('./components/event-signup-form/event-signup-form').then(
      (m) => m.EventSignupFormComponent,
    ),
  gmAvailabilityOverview: () =>
    import('./components/gm-availability-overview/gm-availability-overview').then(
      (m) => m.GmAvailabilityOverviewComponent,
    ),
} as const;

export const authRoutes: Routes = [
  // { path: 'login', loadComponent: loaders.login },
  { path: 'secret-register', loadComponent: loaders.register },
  {
    path: 'edit-profile',
    loadComponent: loaders.editProfile,
    canActivate: [authGuard],
  },
  {
    path: 'event-signup',
    loadComponent: loaders.eventSignup,
    canActivate: [authGuard],
  },
  {
    path: 'event-signup/:eventSlug/:occurrenceDate/signup',
    loadComponent: loaders.eventSignupForm,
    canActivate: [authGuard],
  },
  {
    path: 'admin/gm-availability',
    loadComponent: loaders.gmAvailabilityOverview,
    canActivate: [authGuard, minimumRoleGuard('customer_manager')],
  },
];
