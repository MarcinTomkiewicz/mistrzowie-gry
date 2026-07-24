import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { minimumRoleGuard } from '../../core/guards/minimum-role.guard';

const loaders = {
  workLog: () =>
    import('../components/my-work-log/my-work-log').then(
      (m) => m.MyWorkLog,
    ),
} as const;

const gmGuards = [authGuard, minimumRoleGuard('gm')];

export const gmRoutes: Routes = [
  {
    path: 'work-log',
    loadComponent: loaders.workLog,
    canActivate: gmGuards,
  },
];
