import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { minimumRoleGuard } from '../../core/guards/minimum-role.guard';

const loaders = {
  staffingHub: () =>
    import('../components/gm-staffing-hub/gm-staffing-hub').then(
      (m) => m.GmStaffingHub,
    ),
  staffingDetail: () =>
    import('../components/gm-staffing-realization-detail/gm-staffing-realization-detail').then(
      (m) => m.GmStaffingRealizationDetail,
    ),
  staffingInformation: () =>
    import('../components/gm-staffing-realization-detail/gm-staffing-information').then(
      (m) => m.GmStaffingInformation,
    ),
  staffingTravel: () =>
    import('../components/gm-staffing-realization-detail/gm-staffing-travel').then(
      (m) => m.GmStaffingTravel,
    ),
  staffingParticipation: () =>
    import('../components/gm-staffing-realization-detail/gm-staffing-participation').then(
      (m) => m.GmStaffingParticipation,
    ),
  profileShell: () =>
    import('../components/gm-profile-shell/gm-profile-shell').then(
      (m) => m.GmProfileShell,
    ),
  profile: () =>
    import('../components/gm-profile/gm-profile').then((m) => m.GmProfile),
  sessions: () =>
    import('../components/gm-sessions/gm-sessions').then((m) => m.GmSessions),
  availability: () =>
    import('../components/gm-availability/gm-availability').then(
      (m) => m.GmAvailability,
    ),
  workLog: () =>
    import('../components/my-work-log/my-work-log').then(
      (m) => m.MyWorkLog,
    ),
} as const;

const gmGuards = [authGuard, minimumRoleGuard('gm')];

export const gmRoutes: Routes = [
  {
    path: 'staffing',
    pathMatch: 'full',
    loadComponent: loaders.staffingHub,
    canActivate: gmGuards,
  },
  {
    path: 'staffing/:realizationId',
    loadComponent: loaders.staffingDetail,
    canActivate: gmGuards,
    children: [
      { path: '', pathMatch: 'full', loadComponent: loaders.staffingInformation },
      { path: 'travel-terms', loadComponent: loaders.staffingTravel },
      { path: 'participation', loadComponent: loaders.staffingParticipation },
    ],
  },
  {
    path: 'profile',
    loadComponent: loaders.profileShell,
    canActivate: gmGuards,
    children: [
      { path: '', pathMatch: 'full', loadComponent: loaders.profile },
      { path: 'sessions', loadComponent: loaders.sessions },
      { path: 'availability', loadComponent: loaders.availability },
    ],
  },
  {
    path: 'work-log',
    loadComponent: loaders.workLog,
    canActivate: gmGuards,
  },
];
