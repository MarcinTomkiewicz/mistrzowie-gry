import type { Routes } from '@angular/router';

import { contentRoutes } from './routes/content-routes';
import { eventRoutes } from './routes/event-routes';
import { marketingRoutes } from './routes/marketing-routes';

export const loadNotFound = () =>
  import('./common/not-found/not-found').then((m) => m.NotFound);

export const publicRoutes: Routes = [
  ...marketingRoutes,
  ...contentRoutes,
  ...eventRoutes,
  { path: 'not-found', loadComponent: loadNotFound },
  {
    path: 'not-authorized',
    loadComponent: () =>
      import('./common/not-authorized/not-authorized').then(
        (m) => m.NotAuthorized,
      ),
  },
];
