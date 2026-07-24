import type { Routes } from '@angular/router';

import { accountRoutes } from './routes/account-routes';

const authChildren: Routes = [
  ...accountRoutes,
  {
    path: 'event-signup',
    loadChildren: () =>
      import('./routes/event-routes').then((m) => m.eventRoutes),
  },
  {
    path: 'gm',
    loadChildren: () =>
      import('./routes/gm-routes').then((m) => m.gmRoutes),
  },
  {
    path: 'coworker',
    loadChildren: () =>
      import('./routes/coworker-routes').then((m) => m.coworkerRoutes),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./routes/admin-routes').then((m) => m.authAdminRoutes),
  },
];

export const authRoutes: Routes = [
  {
    path: 'auth',
    children: authChildren,
  },
];
