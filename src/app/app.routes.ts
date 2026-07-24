import type { Routes } from '@angular/router';

import { authRoutes } from './auth/auth-routes';
import { adminRoutes } from './auth/routes/admin-routes';
import {
  loadNotFound,
  publicRoutes,
} from './public/public-routes';

export const routes: Routes = [
  ...publicRoutes,
  ...adminRoutes,
  ...authRoutes,
  { path: '**', loadComponent: loadNotFound },
];
