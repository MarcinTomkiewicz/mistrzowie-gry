import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { minimumRoleGuard } from '../../core/guards/minimum-role.guard';

const loaders = {
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
