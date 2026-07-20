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
      (m) => m.EventSignup,
    ),
  eventSignupForm: () =>
    import('./components/event-signup-form/event-signup-form').then(
      (m) => m.EventSignupForm,
    ),
  myWorkLog: () =>
    import('./components/my-work-log/my-work-log').then(
      (m) => m.MyWorkLog,
    ),
  coworkerProfile: () =>
    import('./components/coworker-profile/coworker-profile').then(
      (m) => m.CoworkerProfileComponent,
    ),
  coworkerShell: () =>
    import('./components/coworker/coworker-shell/coworker-shell').then(
      (m) => m.CoworkerShell,
    ),
  coworkerQuestionnaire: () =>
    import('./components/coworker/questionnaire/questionnaire').then(
      (m) => m.Questionnaire,
    ),
  coworkerDocuments: () =>
    import('./components/coworker/documents/documents').then(
      (m) => m.Documents,
    ),
  coworkerOperationalDocuments: () =>
    import(
      './components/coworker/operational-documents/operational-documents'
    ).then((m) => m.OperationalDocuments),
  gmAvailabilityOverview: () =>
    import('./components/gm-availability-overview/gm-availability-overview').then(
      (m) => m.GmAvailabilityOverview,
    ),
  workLogOverview: () =>
    import('./components/work-log-overview/work-log-overview').then(
      (m) => m.WorkLogOverview,
    ),
  adminUsers: () =>
    import('./components/admin-users/admin-users').then(
      (m) => m.AdminUsers,
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
    path: 'gm/coworker-profile',
    loadComponent: loaders.coworkerProfile,
    canActivate: [authGuard, minimumRoleGuard('gm')],
  },
  {
    path: 'coworker',
    loadComponent: loaders.coworkerShell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'questionnaire' },
      {
        path: 'questionnaire',
        loadComponent: loaders.coworkerQuestionnaire,
      },
      {
        path: 'documents',
        loadComponent: loaders.coworkerDocuments,
        canActivate: [authGuard],
      },
      {
        path: 'operational-documents',
        loadComponent: loaders.coworkerOperationalDocuments,
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: 'gm/work-log',
    loadComponent: loaders.myWorkLog,
    canActivate: [authGuard, minimumRoleGuard('gm')],
  },
  {
    path: 'admin/gm-availability',
    loadComponent: loaders.gmAvailabilityOverview,
    canActivate: [authGuard, minimumRoleGuard('customer_manager')],
  },
  {
    path: 'admin/work-log',
    loadComponent: loaders.workLogOverview,
    canActivate: [authGuard, minimumRoleGuard('customer_manager')],
  },
  {
    path: 'admin/users',
    loadComponent: loaders.adminUsers,
    canActivate: [authGuard, minimumRoleGuard('marketing_manager')],
  },
];
