import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';

const loaders = {
  register: () =>
    import('../components/register/register').then((m) => m.Register),
  resetPassword: () =>
    import('../components/reset-password/reset-password').then(
      (m) => m.ResetPassword,
    ),
  editProfile: () =>
    import('../components/edit-profile/edit-profile').then(
      (m) => m.EditProfile,
    ),
} as const;

export const accountRoutes: Routes = [
  { path: 'secret-register', loadComponent: loaders.register },
  { path: 'reset-password', loadComponent: loaders.resetPassword },
  {
    path: 'edit-profile',
    loadComponent: loaders.editProfile,
    canActivate: [authGuard],
  },
];
