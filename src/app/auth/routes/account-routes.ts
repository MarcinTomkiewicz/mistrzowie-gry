import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { minimumRoleGuard } from '../../core/guards/minimum-role.guard';

const loaders = {
  register: () =>
    import('../components/register/register').then((m) => m.Register),
  editProfile: () =>
    import('../components/edit-profile/edit-profile').then(
      (m) => m.EditProfile,
    ),
  profileEdit: () =>
    import('../components/edit-profile/profile-edit').then(
      (m) => m.ProfileEdit,
    ),
  gmProfile: () =>
    import('../components/gm-profile/gm-profile').then((m) => m.GmProfile),
  gmSessions: () =>
    import('../components/gm-sessions/gm-sessions').then((m) => m.GmSessions),
  gmAvailability: () =>
    import('../components/gm-availability/gm-availability').then(
      (m) => m.GmAvailability,
    ),
} as const;

const gmGuard = [minimumRoleGuard('gm')];

export const accountRoutes: Routes = [
  { path: 'secret-register', loadComponent: loaders.register },
  {
    path: 'edit-profile',
    loadComponent: loaders.editProfile,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      {
        path: 'profile',
        loadComponent: loaders.profileEdit,
      },
      {
        path: 'gm-profile',
        loadComponent: loaders.gmProfile,
        canActivate: gmGuard,
      },
      {
        path: 'gm-sessions',
        loadComponent: loaders.gmSessions,
        canActivate: gmGuard,
      },
      {
        path: 'gm-availability',
        loadComponent: loaders.gmAvailability,
        canActivate: gmGuard,
      },
    ],
  },
];
