import type { Routes } from '@angular/router';

import { loadNotFound, publicRoutes } from './public/public-routes';

export const routes: Routes = [
  ...publicRoutes,
  {
    path: 'admin',
    loadChildren: () =>
      import('./auth/routes/admin-routes').then((m) => m.adminRoutes),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth-routes').then((m) => m.authRoutes),
  },
  { path: '**', loadComponent: loadNotFound },
];
